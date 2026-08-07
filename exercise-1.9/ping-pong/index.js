const http = require("http");

const PORT = process.env.PORT || 3000;

let counter = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    counter += 1;
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${counter}\n`);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found\n");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
