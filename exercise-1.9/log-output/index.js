const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const randomString = crypto.randomUUID();

const getStatus = () => `${new Date().toISOString()}: ${randomString}`;

setInterval(() => {
  console.log(getStatus());
}, 5000);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${getStatus()}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
