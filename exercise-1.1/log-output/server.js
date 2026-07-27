const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const PING_PONG_URL = process.env.PING_PONG_URL || "http://ping-pong.exercises:3000/pings";
const MESSAGE = process.env.MESSAGE || "";
const logFilePath = "/usr/src/app/files/output.txt";
const informationFilePath = "/usr/src/app/config/information.txt";

const getPingCount = () =>
  new Promise((resolve) => {
    http
      .get(PING_PONG_URL, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data.trim());
        });
      })
      .on("error", () => {
        resolve("0");
      });
  });

const server = http.createServer(async (req, res) => {
  let status = "Waiting for log output...";
  let fileContent = "";

  if (fs.existsSync(logFilePath)) {
    status = fs.readFileSync(logFilePath, "utf8");
  }

  if (fs.existsSync(informationFilePath)) {
    fileContent = fs.readFileSync(informationFilePath, "utf8");
  }

  const pingCount = await getPingCount();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`file content: ${fileContent}\nenv variable: MESSAGE=${MESSAGE}\n${status}\nPing / Pongs: ${pingCount}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
