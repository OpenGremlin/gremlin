import "./env.js";
import { createServer } from "node:http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { logger } from "@opengremlin/lib/logger.js";
import { createResources } from "@opengremlin/lib/resources/index.js";
import type { PubSub } from "@opengremlin/lib/resources/pubsub.js";
import { createServices } from "@opengremlin/lib/services/index.js";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import { createYoga } from "graphql-yoga";
import { WebSocketServer } from "ws";
import { getServerBaseUrl, loadSchedulerConfig } from "./config.js";
import type { AuthUser } from "./gql/auth.js";
import { createAuthPlugin } from "./gql/authPlugin.js";
import { createHttpContext } from "./gql/httpContext.js";
import { mergedResolvers } from "./gql/schema/mergedResolvers.js";
import { mergedTypeDefs } from "./gql/schema/mergedTypeDefs.js";
import { createWsContext } from "./gql/wsContext.js";
import { pubsub } from "./pubsub.js";
import { createAuthConfigRoute } from "./routes/authConfigRoute.js";
import {
  clientLogsPreflight,
  clientLogsRoute,
} from "./routes/clientLogsRoute.js";
import { filesCorsPreflight, filesRoute } from "./routes/filesRoute.js";
import { healthRoute } from "./routes/healthRoute.js";
import { mediaRoute } from "./routes/mediaRoute.js";
import { createSpeechSentenceRoute } from "./routes/speechSentenceRoute.js";
import { createWebhookEventsRoute } from "./routes/webhookEventsRoute.js";

const PORT = Number(process.env.PORT || 3001);
const userByRequest = new WeakMap<Request, AuthUser>();
const SKIP_AUTH = process.env.SKIP_AUTH === "true";

const app = express();
app.use(express.json());
// yoga's PubSub and lib's PubSub are structurally identical but use
// separately-defined conditional mapped types that TS can't unify generically.
const resources = createResources(pubsub as unknown as PubSub);
const services = createServices();

const schema = makeExecutableSchema({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
});

const yoga = createYoga({
  schema,
  cors: {
    origin: [
      process.env.ADMIN_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:8081",
    ].filter((o): o is string => Boolean(o)),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  plugins: [createAuthPlugin({ skipAuth: SKIP_AUTH, userByRequest })],
  context: createHttpContext({
    skipAuth: SKIP_AUTH,
    userByRequest,
    getServerBaseUrl,
    resources,
    services,
  }),
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
    context: createWsContext({
      skipAuth: SKIP_AUTH,
      getServerBaseUrl,
      resources,
      services,
    }),
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

// --- Routes ---

app.get("/media/*", mediaRoute);
app.options("/api/files/*", filesCorsPreflight);
app.get("/api/files/*", filesRoute);
app.get("/api/speech/sentence", createSpeechSentenceRoute(resources, services));
app.options("/api/client-logs", clientLogsPreflight);
app.post("/api/client-logs", express.json({ limit: "64kb" }), clientLogsRoute);
app.get("/api/auth-config", createAuthConfigRoute(resources));
app.get("/api/health", healthRoute);
app.post(
  "/api/webhooks/events",
  express.json({ limit: "1mb" }),
  createWebhookEventsRoute(resources, services),
);

// --- Startup ---

let stopSqsWorker: (() => void) | undefined;

loadSchedulerConfig().then(async () => {
  const { startSqsWorker } = await import(
    "@opengremlin/lib/services/inbox/sqsWorker.js"
  );
  const serverBase = await getServerBaseUrl();
  const svcCtx = {
    resources,
    services,
    mediaBaseUrl: `${serverBase}/media`,
    serverBaseUrl: serverBase,
    log: logger.child({ component: "inbox" }),
  };
  stopSqsWorker = startSqsWorker(svcCtx);

  server
    .listen(PORT, () => {
      logger.info({ port: PORT }, "Gremlin server started");
    })
    .on("error", (err: NodeJS.ErrnoException) => {
      // Only auto-reclaim port in local dev — never kill processes in prod
      if (err.code === "EADDRINUSE" && SKIP_AUTH) {
        logger.warn({ port: PORT }, "Port in use, killing existing process…");
        import("node:child_process").then(({ execFile }) => {
          execFile("lsof", ["-ti", `tcp:${PORT}`], (_err, stdout) => {
            if (stdout?.trim()) {
              for (const pid of stdout.trim().split("\n")) {
                try {
                  process.kill(Number(pid), "SIGKILL");
                } catch {
                  // Process already dead
                }
              }
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
