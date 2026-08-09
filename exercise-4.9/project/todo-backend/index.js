const http = require("http");
const { Pool } = require("pg");
const { connect, StringCodec } = require("nats");

const PORT = Number(process.env.PORT);
const MAX_TODO_LENGTH = 140;
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS);
const NATS_URL = process.env.NATS_URL;
const NATS_SUBJECT = process.env.NATS_SUBJECT;
const stringCodec = StringCodec();
let isHealthy = true;
let natsConnection;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const connectToNats = async () => {
  while (!natsConnection) {
    try {
      natsConnection = await connect({
        servers: NATS_URL,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });
      console.log(`Connected to NATS at ${NATS_URL}`);

      natsConnection.closed().then((error) => {
        if (error) console.error(`NATS connection closed: ${error.message}`);
        natsConnection = undefined;
        connectToNats();
      });
    } catch (error) {
      console.log(`Waiting for NATS: ${error.message}`);
      await sleep(3000);
    }
  }
};

const publishTodoEvent = async (type, todo) => {
  if (!natsConnection || natsConnection.isClosed()) {
    console.log(`Skipped ${type}: NATS is unavailable`);
    return;
  }

  const action = type === "todo.created" ? "created" : "updated";
  const event = {
    user: "bot",
    message: `A todo was ${action}`,
    type,
    todo,
  };

  try {
    natsConnection.publish(NATS_SUBJECT, stringCodec.encode(JSON.stringify(event)));
    await natsConnection.flush();
    console.log(`Published ${type} for todo ${todo.id}`);
  } catch (error) {
    console.error(`Unable to publish ${type}: ${error.message}`);
  }
};

const initializeDatabase = async () => {
  while (true) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          content VARCHAR(140) NOT NULL,
          done BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        ALTER TABLE todos
        ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT FALSE
      `);

      console.log("Connected to PostgreSQL");
      return;
    } catch (error) {
      console.log(`Waiting for PostgreSQL: ${error.message}`);
      await sleep(DB_RETRY_MS);
    }
  }
};

const readBody = (req) =>
  new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
  });

const getTodos = async () => {
  const result = await pool.query(
    "SELECT id, content, done FROM todos ORDER BY id"
  );

  return result.rows;
};

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  try {
    if (req.method === "GET" && req.url === "/healthz") {
      if (!isHealthy) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "unhealthy" }));
        return;
      }

      await pool.query("SELECT 1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method === "POST" && req.url === "/break") {
      isHealthy = false;
      console.log("Application health was deliberately broken");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "unhealthy" }));
      return;
    }

    const todoPathMatch = req.url.match(/^\/todos\/(\d+)$/);

    if (req.method === "PUT" && todoPathMatch) {
      const id = Number(todoPathMatch[1]);
      const result = await pool.query(
        "UPDATE todos SET done = TRUE WHERE id = $1 RETURNING id, content, done",
        [id]
      );

      if (result.rowCount === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Todo not found" }));
        return;
      }

      console.log(`Completed todo: ${id}`);
      await publishTodoEvent("todo.updated", result.rows[0]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    if (req.method === "GET" && req.url === "/todos") {
      const todos = await getTodos();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todos));
      return;
    }

    if (req.method === "POST" && req.url === "/todos") {
      const body = await readBody(req);
      const data = JSON.parse(body || "{}");
      const todo = data.todo || data.text;

      if (!todo) {
        console.log("Rejected todo: missing content");
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Todo content is required" }));
        return;
      }

      if (todo.length > MAX_TODO_LENGTH) {
        console.log(`Rejected todo: too long (${todo.length} characters)`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Todo must be 140 characters or less" }));
        return;
      }

      const insertResult = await pool.query(
        "INSERT INTO todos (content) VALUES ($1) RETURNING id, content, done",
        [todo]
      );

      console.log(`Created todo: ${todo}`);
      await publishTodoEvent("todo.created", insertResult.rows[0]);

      const todos = await getTodos();
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todos));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

initializeDatabase().then(() => {
  connectToNats();
  server.listen(PORT, () => {
    console.log(`Todo backend started in port ${PORT}`);
  });
});
