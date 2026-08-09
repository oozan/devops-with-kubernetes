const http = require("http");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT);
const MAX_TODO_LENGTH = 140;
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS);
let isHealthy = true;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

      await pool.query(
        "INSERT INTO todos (content) VALUES ($1)",
        [todo]
      );

      console.log(`Created todo: ${todo}`);

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
  server.listen(PORT, () => {
    console.log(`Todo backend started in port ${PORT}`);
  });
});
