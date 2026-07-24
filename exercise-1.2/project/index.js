const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <!doctype html>
    <html>
      <body>
        <h1>Hello from project app</h1>
        <img src="https://picsum.photos/1200" alt="Random image" />
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
