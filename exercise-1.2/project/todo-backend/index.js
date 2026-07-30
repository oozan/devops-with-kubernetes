const http = require("http");

const PORT = process.env.PORT || 3000;
const MAX_TODO_LENGTH = 140;

let todos = ["Learn Kubernetes", "Build a todo app"];

const readBody = (req) =>
  new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
  });

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  if (req.method === "GET" && req.url === "/todos") {
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

    todos.push(todo);
    console.log(`Created todo: ${todo}`);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todos));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found\n");
});

server.listen(PORT, () => {
  console.log(`Todo backend started in port ${PORT}`);
});
