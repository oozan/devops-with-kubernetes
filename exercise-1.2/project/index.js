const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const filesDir = "/usr/src/app/files";
const imagePath = path.join(filesDir, "image.jpg");
const metadataPath = path.join(filesDir, "image-metadata.json");
const TEN_MINUTES = 10 * 60 * 1000;

fs.mkdirSync(filesDir, { recursive: true });

const isImageFresh = () => {
  if (!fs.existsSync(imagePath) || !fs.existsSync(metadataPath)) {
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  return Date.now() - metadata.createdAt < TEN_MINUTES;
};

const cacheImage = async () => {
  if (isImageFresh()) {
    return;
  }

  const response = await fetch("https://picsum.photos/1200");
  const buffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(imagePath, buffer);
  fs.writeFileSync(metadataPath, JSON.stringify({ createdAt: Date.now() }));
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/image.jpg") {
    await cacheImage();

    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(fs.readFileSync(imagePath));
    return;
  }

  await cacheImage();

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <!doctype html>
    <html>
      <body style="font-family: Arial; text-align: center;">
        <h1>Todo App</h1>
        <img src="/image.jpg" alt="Random image" style="max-width: 500px;" />
        <p>DevOps with Kubernetes 2026</p>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
