const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const logFilePath = "/usr/src/app/files/output.txt";
const pingpongFilePath = "/usr/src/app/files/pingpong.txt";

const server = http.createServer((req, res) => {
  let status = "Waiting for log output...";
  let pongCount = "0";

  if (fs.existsSync(logFilePath)) {
    status = fs.readFileSync(logFilePath, "utf8");
  }

  if (fs.existsSync(pingpongFilePath)) {
    pongCount = fs.readFileSync(pingpongFilePath, "utf8");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${status}\nPing / Pongs: ${pongCount}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
