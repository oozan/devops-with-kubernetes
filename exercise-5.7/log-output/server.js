const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const PING_PONG_HOST = process.env.PING_PONG_HOST || "pingpong.exercises.svc.cluster.local";
const PING_PONG_COUNT_URL = `http://${PING_PONG_HOST}/pings`;
const PING_PONG_INCREMENT_URL = `http://${PING_PONG_HOST}/pingpong`;
const logFilePath = "/usr/src/app/files/output.txt";

const requestPingPong = (url) =>
  new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        if (response.statusCode === 200) resolve(data);
        else reject(new Error(`Ping-pong returned ${response.statusCode}`));
      });
    });
    request.setTimeout(10000, () => request.destroy(new Error("Ping-pong timed out")));
    request.on("error", reject);
  });

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.url === "/pingpong") {
      const pong = await requestPingPong(PING_PONG_INCREMENT_URL);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(pong);
      return;
    }

    if (req.url === "/") {
      const status = fs.existsSync(logFilePath)
        ? fs.readFileSync(logFilePath, "utf8")
        : "Waiting for log output...";
      const pingCount = (await requestPingPong(PING_PONG_COUNT_URL)).trim();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`${status}\nPing / Pongs: ${pingCount}\n`);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  } catch (error) {
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end(`Ping-pong unavailable: ${error.message}\n`);
  }
});

server.listen(PORT, () => console.log(`Server started in port ${PORT}`));
