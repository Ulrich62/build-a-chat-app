import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.url === "/script.js") {
    fs.readFile(path.join(__dirname, "public/script.js"), (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
  } else {
    fs.readFile(path.join(__dirname, "public/index.html"), (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
});

const wss = new WebSocketServer({ server });

function broadcast(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (socket, req) => {
  const username =
    new URL(req.url, "http://localhost").searchParams.get("username") ||
    "Anonymous";

  broadcast({ type: "system", text: `${username} joined` });

  socket.on("message", (raw) => {
    try {
      const { username: sender, text } = JSON.parse(raw);
      broadcast({ type: "chat", username: sender, text });
    } catch (e) {
      console.error("Invalid message format:", e);
    }
  });

  socket.on("close", () => {
    broadcast({ type: "system", text: `${username} left` });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});

export { server, wss };
