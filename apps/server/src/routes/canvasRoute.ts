import { createLogger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { CanvasEvent } from "@opengremlin/lib/services/canvas/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import type { Request, Response } from "express";
import { verifyToken } from "../gql/auth.js";

const log = createLogger("canvas-route");

const ALLOWED_ORIGINS = new Set(
  [
    process.env.ADMIN_ORIGIN,
    "https://ogcaster.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8081",
  ].filter((o): o is string => Boolean(o)),
);

function setCors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
}

export function canvasCorsPreflight(req: Request, res: Response): void {
  setCors(req, res);
  res.status(204).end();
}

async function authedUser(
  req: Request,
  res: Response,
): Promise<{ sub: string } | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing bearer token" });
    return null;
  }
  try {
    return await verifyToken(header.slice("Bearer ".length).trim());
  } catch (err) {
    log.warn({ err }, "canvas auth failed");
    res.status(401).json({ error: "invalid token" });
    return null;
  }
}

// POST /canvas/sessions — create a new cast session
export function createCanvasSessionRoute(
  resources: Resources,
  services: Services,
) {
  return async (req: Request, res: Response): Promise<void> => {
    setCors(req, res);
    const user = await authedUser(req, res);
    if (!user) return;
    const session = await services.canvas.createSession(resources, user.sub);
    res.status(201).json(session);
  };
}

// POST /canvas/sessions/:id/bind — bind/unbind agent
export function bindCanvasSessionRoute(
  resources: Resources,
  services: Services,
) {
  return async (req: Request, res: Response): Promise<void> => {
    setCors(req, res);
    const user = await authedUser(req, res);
    if (!user) return;
    const sessionId = req.params.id;
    const body = req.body as { agentId?: string | null };
    const agentId = body.agentId === undefined ? null : body.agentId;
    if (agentId !== null && typeof agentId !== "string") {
      res.status(400).json({ error: "agentId must be string or null" });
      return;
    }
    try {
      await services.canvas.bindAgent(resources, sessionId, user.sub, agentId);
      res.status(204).end();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "Forbidden") {
        res.status(403).json({ error: msg });
      } else if (msg === "Session not found") {
        res.status(404).json({ error: msg });
      } else {
        log.error({ err, sessionId }, "bind failed");
        res.status(500).json({ error: "bind failed" });
      }
    }
  };
}

// POST /canvas/sessions/:id/end — invalidate session
export function endCanvasSessionRoute(
  resources: Resources,
  services: Services,
) {
  return async (req: Request, res: Response): Promise<void> => {
    setCors(req, res);
    const user = await authedUser(req, res);
    if (!user) return;
    try {
      await services.canvas.endSession(resources, req.params.id, user.sub);
      res.status(204).end();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "Forbidden") {
        res.status(403).json({ error: msg });
      } else {
        log.error({ err, sessionId: req.params.id }, "end failed");
        res.status(500).json({ error: "end failed" });
      }
    }
  };
}

// GET /canvas/sse?t=<token> — SSE stream of session events
export function canvasSseRoute(resources: Resources, services: Services) {
  return async (req: Request, res: Response): Promise<void> => {
    setCors(req, res);
    const token = typeof req.query.t === "string" ? req.query.t : undefined;
    if (!token) {
      res.status(401).end("missing token");
      return;
    }
    let payload: { sub: string; sid: string };
    try {
      payload = await services.canvas.verifyCanvasToken(token);
    } catch {
      res.status(401).end("invalid token");
      return;
    }

    const session = await services.canvas.getSession(resources, payload.sid);
    if (!session) {
      res.status(404).end("session not found");
      return;
    }
    // Defense-in-depth: token's session can only be opened by its
    // original owner. The token's signature already binds it to a
    // sessionId, but cross-checking against the row guards against a
    // future bug that would let one user's token resolve someone
    // else's session.
    if (session.userId !== payload.sub) {
      res.status(403).end("forbidden");
      return;
    }

    res.set("Content-Type", "text/event-stream");
    res.set("Cache-Control", "no-cache, no-transform");
    res.set("Connection", "keep-alive");
    res.set("X-Accel-Buffering", "no"); // disable nginx/proxy buffering
    res.flushHeaders();

    const send = (event: CanvasEvent) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Replay current bind state on connect so the canvas hydrates
    // immediately without waiting for the next mobile-driven bind.
    // Also repopulate the in-memory sessionsByAgent index, which
    // restart-clears but needs to exist for state publishes to find
    // this session.
    if (session.currentAgentId) {
      services.canvas.rememberBinding(session.currentAgentId, payload.sid);
      send({ type: "agentBound", agentId: session.currentAgentId });
      const state = await services.canvas.getCanvasState(
        resources,
        session.currentAgentId,
        session.userId,
      );
      if (state) send({ type: "stateSnapshot", tree: state });
    }

    const unsubscribe = services.canvas.subscribe(payload.sid, {
      send,
      close: () => res.end(),
    });

    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  };
}
