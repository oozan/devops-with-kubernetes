const http = require("http");

const PORT = process.env.PORT || 3000;

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
  if (req.method === "GET" && req.url === "/todos") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    const body = await readBody(req);
    const data = JSON.parse(body || "{}");

    if (data.todo) {
      todos.push(data.todo);
    }

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
