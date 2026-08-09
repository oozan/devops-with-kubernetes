const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT);
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL;
const filesDir = "/usr/src/app/files";
const imagePath = path.join(filesDir, "image.jpg");
const metadataPath = path.join(filesDir, "image-metadata.json");
const IMAGE_URL = process.env.IMAGE_URL;
const IMAGE_CACHE_MINUTES = Number(process.env.IMAGE_CACHE_MINUTES);
const IMAGE_CACHE_TIME = IMAGE_CACHE_MINUTES * 60 * 1000;

fs.mkdirSync(filesDir, { recursive: true });

const isImageFresh = () => {
  if (!fs.existsSync(imagePath) || !fs.existsSync(metadataPath)) {
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  return Date.now() - metadata.createdAt < IMAGE_CACHE_TIME;
};

const cacheImage = async () => {
  if (isImageFresh()) {
    return;
  }

  const response = await fetch(IMAGE_URL);
  const buffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(imagePath, buffer);
  fs.writeFileSync(metadataPath, JSON.stringify({ createdAt: Date.now() }));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => resolve(body));
  });

const getTodos = async () => {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`);
  return response.json();
};

const createTodo = async (todo) => {
  await fetch(`${TODO_BACKEND_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todo }),
  });
};

const backendIsHealthy = async () => {
  try {
    const response = await fetch(`${TODO_BACKEND_URL}/healthz`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

const breakApp = async () => {
  await fetch(`${TODO_BACKEND_URL}/break`, { method: "POST" });
};

const renderPage = async () => {
  await cacheImage();
  const todos = await getTodos();

  return `
    <!doctype html>
    <html>
      <body style="font-family: Arial; text-align: center;">
        <h1>Todo App</h1>
        <p>${process.env.MESSAGE}</p>
        <img src="/image.jpg" alt="Random image" style="max-width: 500px;" />

        <form method="POST" action="/todos" style="margin-top: 20px;">
          <input name="todo" maxlength="140" />
          <button type="submit">Create TODO</button>
        </form>

        <form method="POST" action="/break" style="margin-top: 12px;">
          <button type="submit" style="background: #c62828; color: white;">Break app</button>
        </form>

        <ul style="display: inline-block; text-align: left;">
          ${todos.map((todo) => `<li>${todo}</li>`).join("")}
        </ul>
      </body>
    </html>
  `;
};

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    const isHealthy = await backendIsHealthy();
    res.writeHead(isHealthy ? 200 : 500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: isHealthy ? "ok" : "backend unavailable" }));
    return;
  }

  if (req.url === "/image.jpg") {
    await cacheImage();

    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(fs.readFileSync(imagePath));
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    const body = await readBody(req);
    const params = new URLSearchParams(body);
    const todo = params.get("todo");

    if (todo && todo.length <= 140) {
      await createTodo(todo);
    }

    res.writeHead(303, { Location: "/project" });
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/break") {
    await breakApp();
    res.writeHead(303, { Location: "/project" });
    res.end();
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(await renderPage());
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
