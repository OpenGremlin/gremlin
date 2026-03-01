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
import { WebSocketServer } from "ws";
import { type AuthUser, verifyToken } from "./gql/auth.js";
import { mergedResolvers } from "./gql/schema/mergedResolvers.js";
import { mergedTypeDefs } from "./gql/schema/mergedTypeDefs.js";

const PORT = Number(process.env.PORT || 3001);
const userByRequest = new WeakMap<Request, AuthUser>();
const SKIP_AUTH = process.env.SKIP_AUTH === "true";
const MEDIA_CDN_URL = (
  process.env.MEDIA_CDN_URL || `http://localhost:${process.env.PORT || 3001}`
).replace(/\/$/, "");
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
          const user = await verifyToken(header.slice(7));
          userByRequest.set(request, user);
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
      return {
        user: { sub: "local", email: "local@dev" } as AuthUser,
        mediaCdnUrl: MEDIA_CDN_URL,
      };
    }
    const user = userByRequest.get(request)!;
    return { user, mediaCdnUrl: MEDIA_CDN_URL };
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

// Serve media assets locally (in production CloudFront handles this)
if (!process.env.MEDIA_CDN_URL) {
  const mediaAssets = path.resolve(__dirname, "../../../apps/media-server/assets");
  app.use("/avatars", express.static(path.join(mediaAssets, "avatars")));
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
const defaultLayoutJson = JSON.stringify(defaultLayout);

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.send(defaultLayoutJson);

  ws.on("message", (raw) => {
    let message: { type?: string; text?: string };
    try {
      message = JSON.parse(raw.toString());
    } catch {
      console.error("Invalid JSON from client:", raw.toString().slice(0, 200));
      return;
    }
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

  ws.on("error", (err) => console.error("WebSocket error:", err));
  ws.on("close", () => console.log("Client disconnected"));
});

server.listen(PORT, () => {
  console.log(`Gremlin server running at http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});

function shutdown() {
  for (const client of wss.clients) {
    client.terminate();
  }
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
