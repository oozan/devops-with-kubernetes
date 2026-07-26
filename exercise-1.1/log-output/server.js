const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const filePath = "/usr/src/app/files/output.txt";

const server = http.createServer((req, res) => {
  let status = "Waiting for log output...";

  if (fs.existsSync(filePath)) {
    status = fs.readFileSync(filePath, "utf8");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${status}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
