import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { createServer } from "node:http";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import { createYoga } from "graphql-yoga";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";
import { type AuthUser, verifyToken } from "./gql/auth.js";
import { mergedResolvers } from "./gql/schema/mergedResolvers.js";
import { mergedTypeDefs } from "./gql/schema/mergedTypeDefs.js";
import { createResources } from "./resources/index.js";
import { createServices } from "./services/index.js";

const PORT = Number(process.env.PORT || 3001);
const userByRequest = new WeakMap<Request, AuthUser>();
const SKIP_AUTH = process.env.SKIP_AUTH === "true";
const MEDIA_CDN_URL = (
  process.env.MEDIA_CDN_URL || `http://localhost:${process.env.PORT || 3001}`
).replace(/\/$/, "");

let cachedAdminOrigin: string | undefined;
async function getAdminOrigin(): Promise<string> {
  if (cachedAdminOrigin) return cachedAdminOrigin;
  if (!SKIP_AUTH) {
    try {
      const ssm = new SSMClient({});
      const res = await ssm.send(
        new GetParameterCommand({ Name: "/gremlin/admin-url" }),
      );
      if (res.Parameter?.Value) {
        cachedAdminOrigin = res.Parameter.Value;
        return cachedAdminOrigin;
      }
    } catch {
      // SSM not available — fall through
    }
  }
  cachedAdminOrigin =
    process.env.ADMIN_ORIGIN ?? "http://localhost:5173";
  return cachedAdminOrigin;
}

const app = express();
const resources = createResources();
const services = createServices();

const schema = makeExecutableSchema({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
});

const yoga = createYoga({
  schema,
  cors: {
    origin: [process.env.ADMIN_ORIGIN, "http://localhost:5173"].filter(
      (o): o is string => Boolean(o),
    ),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
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
    const user = SKIP_AUTH
      ? ({ sub: "local", email: "local@dev" } as AuthUser)
      : (userByRequest.get(request) as AuthUser);
    return { user, mediaCdnUrl: MEDIA_CDN_URL, resources, services };
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

// WebSocket server for GraphQL subscriptions
const wsServer = new WebSocketServer({ noServer: true });
useServer(
  {
    schema,
    context: async (ctx: { connectionParams?: Record<string, unknown> }) => {
      const token = ctx.connectionParams?.token as string | undefined;
      let user: AuthUser;
      if (SKIP_AUTH) {
        user = { sub: "local", email: "local@dev" } as AuthUser;
      } else {
        if (!token) throw new Error("Unauthorized");
        user = await verifyToken(token);
      }
      return { user, mediaCdnUrl: MEDIA_CDN_URL, resources, services };
    },
  },
  wsServer,
);

server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/graphql")) {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      wsServer.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Serve media assets locally (in production CloudFront handles this)
if (!process.env.MEDIA_CDN_URL) {
  const mediaAssets = path.resolve(
    __dirname,
    "../../../apps/media-server/assets",
  );
  app.use("/avatars", express.static(path.join(mediaAssets, "avatars")));
}

// OAuth callback (provider-based)
// Google's redirect URI is registered as /auth/google/callback, so keep that path
app.get("/auth/google/callback", async (req, res) => {
  const adminOrigin = await getAdminOrigin();
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    res.redirect(`${adminOrigin}/integrations?error=google_oauth_failed`);
    return;
  }

  try {
    await services.google.handleGoogleCallback(resources, code, state);
    res.redirect(`${adminOrigin}/integrations/google?connected=true`);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    res.redirect(`${adminOrigin}/integrations?error=google_oauth_failed`);
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Gremlin server running at http://localhost:${PORT}`);
});

// Start cron for scheduled jobs and follow-ups
const cronCtx = { resources, services, mediaCdnUrl: MEDIA_CDN_URL };
const stopCron = services.orchestrator.startCron(cronCtx);

function shutdown() {
  stopCron();
  wsServer.close();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

