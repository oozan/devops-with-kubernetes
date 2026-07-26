const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const filePath = "/usr/src/app/files/pingpong.txt";

fs.mkdirSync("/usr/src/app/files", { recursive: true });

let counter = 0;

if (fs.existsSync(filePath)) {
  const saved = Number(fs.readFileSync(filePath, "utf8"));
  if (!Number.isNaN(saved)) {
    counter = saved;
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    counter += 1;
    fs.writeFileSync(filePath, String(counter));

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
