import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { createServer } from "node:http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { LayoutStateMessage } from "@gremlin/shared-types";
import express from "express";
import { createYoga } from "graphql-yoga";
import { WebSocket, WebSocketServer } from "ws";
import { type AuthUser, verifyToken } from "./gql/auth.js";
import { mergedResolvers } from "./gql/schema/mergedResolvers.js";
import { mergedTypeDefs } from "./gql/schema/mergedTypeDefs.js";

const PORT = Number(process.env.PORT || 3001);
const SKIP_AUTH = process.env.SKIP_AUTH === "true";
const app = express();

const yoga = createYoga({
  schema: makeExecutableSchema({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
  }),
  cors: {
    origin: process.env.ADMIN_ORIGIN ?? "http://localhost:5173",
    credentials: true,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  plugins: [
    {
      async onRequest({ request, fetchAPI, endResponse }) {
        if (SKIP_AUTH || request.method === "OPTIONS") return;

        const header = request.headers.get("authorization");
        if (!header?.startsWith("Bearer ")) {
          endResponse(
            fetchAPI.Response.json(
              { errors: [{ message: "Unauthorized" }] },
              { status: 401 },
            ),
          );
          return;
        }

        try {
          await verifyToken(header.slice(7));
        } catch (err) {
          console.error("Auth failed:", err);
          endResponse(
            fetchAPI.Response.json(
              { errors: [{ message: "Unauthorized" }] },
              { status: 401 },
            ),
          );
        }
      },
    },
  ],
  context: async ({ request }: { request: Request }) => {
    if (SKIP_AUTH) {
      return { user: { sub: "local", email: "local@dev" } as AuthUser };
    }
    const token = request.headers.get("authorization")?.slice(7) ?? "";
    const user = await verifyToken(token);
    return { user };
  },
  graphiql: SKIP_AUTH,
});

const server = createServer((req, res) => {
  if (req.url?.startsWith("/graphql")) {
    yoga(req, res);
    return;
  }
  app(req, res);
});

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

process.on("SIGTERM", () => {
  wss.close();
  server.close();
});
process.on("SIGINT", () => {
  wss.close();
  server.close();
});
