import "./env.js";
import { createServer } from "node:http";
import path from "node:path";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createLogger, logger } from "@gremlin/lib/logger.js";
import { createResources } from "@gremlin/lib/resources/index.js";
import type { PubSub } from "@gremlin/lib/resources/pubsub.js";
import { createServices } from "@gremlin/lib/services/index.js";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import { createYoga } from "graphql-yoga";
import { WebSocketServer } from "ws";
import { type AuthUser, verifyToken } from "./gql/auth.js";
import { createLoaders } from "./gql/loaders.js";
import { mergedResolvers } from "./gql/schema/mergedResolvers.js";
import { mergedTypeDefs } from "./gql/schema/mergedTypeDefs.js";
import { createNotifyHookHandler } from "./notifyHook.js";
import { pubsub } from "./pubsub.js";

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
  cachedAdminOrigin = process.env.ADMIN_ORIGIN ?? "http://localhost:5173";
  return cachedAdminOrigin;
}

// Load scheduler config from SSM (set by MessagingStack)
async function loadSchedulerConfig() {
  if (SKIP_AUTH) return; // local dev — no SSM
  try {
    const ssm = new SSMClient({});
    const params = [
      "/gremlin/schedule-target-lambda-arn",
      "/gremlin/scheduler-role-arn",
      "/gremlin/doorbell-queue-url",
    ];
    const envKeys = [
      "SCHEDULE_TARGET_LAMBDA_ARN",
      "SCHEDULER_ROLE_ARN",
      "DOORBELL_QUEUE_URL",
    ];
    await Promise.all(
      params.map(async (name, i) => {
        const res = await ssm.send(new GetParameterCommand({ Name: name }));
        if (res.Parameter?.Value) process.env[envKeys[i]] = res.Parameter.Value;
      }),
    );
  } catch {
    // SSM not available — scheduler features disabled
  }
}

const app = express();
app.use(express.json());
// yoga's PubSub and lib's PubSub are structurally identical but use
// separately-defined conditional mapped types that TS can't unify generically.
const resources = createResources(pubsub as unknown as PubSub);
const services = createServices();

// Internal notify hook endpoint (called by sandbox instances)
app.post("/notifyHook", createNotifyHookHandler(resources, services));

const schema = makeExecutableSchema({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
});

const yoga = createYoga({
  schema,
  cors: {
    origin: [process.env.ADMIN_ORIGIN, "http://localhost:5173", "http://localhost:5174"].filter(
      (o): o is string => Boolean(o),
    ),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  plugins: [
    {
      async onRequest({ request, fetchAPI, endResponse }) {
        logger.info(
          { method: request.method, url: request.url, component: "http" },
          "Incoming request",
        );

        if (SKIP_AUTH || request.method === "OPTIONS") return;

        const header = request.headers.get("authorization");
        if (!header?.startsWith("Bearer ")) {
          logger.warn(
            { url: request.url, component: "auth" },
            "Missing auth header",
          );
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
          logger.error({ err, component: "auth" }, "Auth failed");
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
    return {
      user,
      mediaCdnUrl: MEDIA_CDN_URL,
      resources,
      services,
      loaders: createLoaders(resources),
      log: logger.child({
        requestId: crypto.randomUUID(),
        userId: user?.sub,
        component: "graphql",
      }),
    };
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
      return {
        user,
        mediaCdnUrl: MEDIA_CDN_URL,
        resources,
        services,
        loaders: createLoaders(resources),
        log: logger.child({
          requestId: crypto.randomUUID(),
          userId: user.sub,
          component: "ws",
        }),
      };
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
    "../../../packages/media-server/assets",
  );
  app.use("/avatars", express.static(path.join(mediaAssets, "avatars")));
  app.use("/tasks", express.static(path.join(mediaAssets, "tasks")));
}

// Client-side log ingestion
const clientLog = createLogger("admin-client");
app.post("/api/client-logs", express.json({ limit: "64kb" }), (req, res) => {
  const { entries } = req.body ?? {};
  if (!Array.isArray(entries)) {
    res.status(400).json({ error: "entries must be an array" });
    return;
  }
  for (const entry of entries.slice(0, 50)) {
    const meta = {
      url: entry.url,
      data: entry.data,
      clientTimestamp: entry.timestamp,
    };
    const msg: string = entry.message ?? "client log";
    if (entry.level === "error") clientLog.error(meta, msg);
    else if (entry.level === "warn") clientLog.warn(meta, msg);
    else if (entry.level === "debug") clientLog.debug(meta, msg);
    else clientLog.info(meta, msg);
  }
  res.status(204).end();
});

// Auth config (unauthenticated — needed by desktop app before login)
app.get("/api/auth-config", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!cognitoDomain || !clientId) {
    res.status(503).json({ error: "Auth not configured" });
    return;
  }
  res.json({ cognitoDomain, clientId });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

let stopSqsWorker: (() => void) | undefined;

loadSchedulerConfig().then(async () => {
  // Start SQS worker if queue URL is available (deployed environment)
  const { startSqsWorker } = await import(
    "@gremlin/lib/services/inbox/sqsWorker.js"
  );
  const svcCtx = {
    resources,
    services,
    mediaCdnUrl: MEDIA_CDN_URL,
    log: logger.child({ component: "inbox" }),
  };
  stopSqsWorker = startSqsWorker(svcCtx);

  server
    .listen(PORT, () => {
      logger.info({ port: PORT }, "Gremlin server started");
    })
    .on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        logger.warn({ port: PORT }, "Port in use, killing existing process…");
        import("node:child_process").then(({ execSync }) => {
          try {
            execSync(`lsof -ti tcp:${PORT} | xargs kill -9`, {
              stdio: "ignore",
            });
          } catch {
            // No process found or already dead
          }
          setTimeout(() => {
            server.listen(PORT, () => {
              logger.info(
                { port: PORT },
                "Gremlin server started (reclaimed port)",
              );
            });
          }, 500);
        });
      } else {
        throw err;
      }
    });
});

function shutdown() {
  stopSqsWorker?.();
  wsServer.close();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
