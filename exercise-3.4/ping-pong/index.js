const http = require("http");
const { Client } = require("pg");

const PORT = process.env.PORT || 3000;

let client;

const createClient = () =>
  new Client({
    host: process.env.POSTGRES_HOST || "postgres.exercises.svc.cluster.local",
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || "pingpong",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  });

const connectToDatabase = async () => {
  while (true) {
    try {
      client = createClient();
      await client.connect();

      await client.query(`
        CREATE TABLE IF NOT EXISTS pings (
          id INTEGER PRIMARY KEY,
          count INTEGER NOT NULL
        )
      `);

      await client.query(`
        INSERT INTO pings (id, count)
        VALUES (1, 0)
        ON CONFLICT (id) DO NOTHING
      `);

      console.log("Connected to PostgreSQL");
      return;
    } catch (error) {
      console.log(`Waiting for PostgreSQL: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

const getCount = async () => {
  const result = await client.query("SELECT count FROM pings WHERE id = 1");
  return result.rows[0].count;
};

const incrementCount = async () => {
  const result = await client.query(
    "UPDATE pings SET count = count + 1 WHERE id = 1 RETURNING count"
  );
  return result.rows[0].count;
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    const count = await incrementCount();

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${count}\n`);
    return;
  }

  if (req.url === "/pings") {
    const count = await getCount();

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${count}\n`);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found\n");
});

connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
  });
});
