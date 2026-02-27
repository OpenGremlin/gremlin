import { createServer } from "node:http";
import type { LayoutStateMessage } from "@gremlin/shared-types";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3001);
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Broadcast to all connected clients
export function broadcast(data: object) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Default layout state
const defaultLayout: LayoutStateMessage = {
  type: "layout_state",
  mode: "idle",
  modules: [
    { id: "clock-1", type: "clock", lifecycle: "active", data: {} },
    { id: "weather-1", type: "weather", lifecycle: "active", data: {} },
  ],
  avatar: "dormant",
  profileId: "family",
};

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.send(JSON.stringify(defaultLayout));

  ws.on("message", (raw) => {
    const message = JSON.parse(raw.toString());
    console.log("Received:", message);

    // Echo commands back as task updates for now
    if (message.type === "command") {
      ws.send(
        JSON.stringify({
          type: "task_update",
          taskId: crypto.randomUUID(),
          status: "complete",
          summary: `Received: "${message.text}"`,
        }),
      );
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});

server.listen(PORT, () => {
  console.log(`Gremlin server running at http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
