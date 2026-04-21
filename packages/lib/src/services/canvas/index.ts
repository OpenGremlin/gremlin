import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import {
  $remove,
  UpdateItemCommand,
} from "dynamodb-toolbox/entity/actions/update";
import * as jose from "jose";
import type { CanvasSessionItem } from "../../resources/ddb/schema/canvasSession.js";
import type { CanvasStateItem } from "../../resources/ddb/schema/canvasState.js";
import type { Resources } from "../../resources/index.js";

const TOKEN_TTL_SECONDS = 5 * 60;
const CANVAS_STATE_TTL_DAYS = 30;
const ISSUER = "canvas";
const ALG = "HS256";

// ── A2UI-ish tree shape (v1 placeholder) ──────────────────────
// Real A2UI comes with the renderer work in step 7; this minimal
// schema lets canvas.show/clear round-trip through the backend and
// render plausibly in the meantime.

export type CanvasNode =
  | { type: "text"; content: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "code"; lang?: string; content: string }
  | { type: "stack"; direction: "v" | "h"; children: CanvasNode[] };

export interface CanvasTree {
  revision: number;
  root: CanvasNode;
}

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.CANVAS_JWT_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CANVAS_JWT_SECRET must be set in production");
    }
    cachedSecret = new TextEncoder().encode(
      "canvas-dev-secret-do-not-use-in-prod",
    );
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

// ── Token mint / verify ────────────────────────────────────────

export interface CanvasTokenPayload {
  /** userId — Cognito sub */
  sub: string;
  /** sessionId */
  sid: string;
  iat: number;
  exp: number;
}

async function mintToken(
  userId: string,
  sessionId: string,
  ttl: number,
): Promise<string> {
  return new jose.SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .setIssuer(ISSUER)
    .sign(getSecret());
}

export async function verifyCanvasToken(
  token: string,
): Promise<CanvasTokenPayload> {
  const { payload } = await jose.jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    algorithms: [ALG],
  });
  return payload as unknown as CanvasTokenPayload;
}

// ── In-memory subscribers ──────────────────────────────────────
// Single-process for v1. Multi-process scale-out would need Redis or
// SQS fan-out; revisit when the server runs >1 task.

export type CanvasEvent =
  | { type: "agentBound"; agentId: string }
  | { type: "agentUnbound" }
  | { type: "stateSnapshot"; tree: CanvasTree }
  | { type: "stateCleared" }
  | { type: "sessionEnded" }
  | { type: "heartbeat" };

export interface Subscriber {
  send: (event: CanvasEvent) => void;
  close: () => void;
}

const subscribersBySession = new Map<string, Set<Subscriber>>();

// Mirrors CanvasSession.currentAgentId in-memory so we can fan state
// updates out to every session bound to a given agent without touching
// DDB on the hot path. Populated by bindAgent / endSession; on server
// restart the first SSE connect per session repopulates it (see route).
const sessionsByAgent = new Map<string, Set<string>>();

function trackBind(agentId: string, sessionId: string): void {
  let set = sessionsByAgent.get(agentId);
  if (!set) {
    set = new Set();
    sessionsByAgent.set(agentId, set);
  }
  set.add(sessionId);
}

function untrackBind(agentId: string, sessionId: string): void {
  const set = sessionsByAgent.get(agentId);
  if (!set) return;
  set.delete(sessionId);
  if (set.size === 0) sessionsByAgent.delete(agentId);
}

export function rememberBinding(agentId: string, sessionId: string): void {
  trackBind(agentId, sessionId);
}

export function subscribe(sessionId: string, sub: Subscriber): () => void {
  let set = subscribersBySession.get(sessionId);
  if (!set) {
    set = new Set();
    subscribersBySession.set(sessionId, set);
  }
  set.add(sub);
  return () => {
    const current = subscribersBySession.get(sessionId);
    if (!current) return;
    current.delete(sub);
    if (current.size === 0) subscribersBySession.delete(sessionId);
  };
}

function publish(sessionId: string, event: CanvasEvent): void {
  const set = subscribersBySession.get(sessionId);
  if (!set) return;
  // Drop subscribers whose write fails — the underlying socket is gone
  // and req.on("close") may not have fired yet. Without this, dead
  // entries pile up in long-running processes.
  const dead: Subscriber[] = [];
  for (const sub of set) {
    try {
      sub.send(event);
    } catch {
      dead.push(sub);
    }
  }
  for (const sub of dead) set.delete(sub);
  if (set.size === 0) subscribersBySession.delete(sessionId);
}

function publishToAgent(agentId: string, event: CanvasEvent): void {
  const sessions = sessionsByAgent.get(agentId);
  if (!sessions) return;
  for (const sid of sessions) publish(sid, event);
}

function closeAll(sessionId: string): void {
  const set = subscribersBySession.get(sessionId);
  if (!set) return;
  for (const sub of set) {
    try {
      sub.close();
    } catch {
      // Ignore — we're tearing this whole session down
    }
  }
  subscribersBySession.delete(sessionId);
}

// ── Session CRUD ───────────────────────────────────────────────

export interface CreatedSession {
  sessionId: string;
  token: string;
  expiresAt: string; // ISO 8601
}

export async function createSession(
  resources: Resources,
  userId: string,
): Promise<CreatedSession> {
  const sessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + TOKEN_TTL_SECONDS;
  const token = await mintToken(userId, sessionId, ttl);

  await resources.ddb.entities.CanvasSession.build(PutItemCommand)
    .item({
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
      ttl,
    })
    .send();

  return {
    sessionId,
    token,
    expiresAt: new Date(ttl * 1000).toISOString(),
  };
}

export async function getSession(
  resources: Resources,
  sessionId: string,
): Promise<CanvasSessionItem | null> {
  const { Item } = await resources.ddb.entities.CanvasSession.build(
    GetItemCommand,
  )
    .key({ sessionId })
    .send();
  return (Item ?? null) as CanvasSessionItem | null;
}

export async function bindAgent(
  resources: Resources,
  sessionId: string,
  userId: string,
  agentId: string | null,
): Promise<void> {
  const session = await getSession(resources, sessionId);
  if (!session) throw new Error("Session not found");
  if (session.userId !== userId) throw new Error("Forbidden");

  const previousAgentId = session.currentAgentId ?? null;

  if (agentId === null) {
    await resources.ddb.entities.CanvasSession.build(UpdateItemCommand)
      .item({ sessionId, currentAgentId: $remove() })
      .send();
    if (previousAgentId) untrackBind(previousAgentId, sessionId);
    publish(sessionId, { type: "agentUnbound" });
    return;
  }

  await resources.ddb.entities.CanvasSession.build(UpdateItemCommand)
    .item({ sessionId, currentAgentId: agentId })
    .send();

  if (previousAgentId && previousAgentId !== agentId) {
    untrackBind(previousAgentId, sessionId);
  }
  trackBind(agentId, sessionId);

  publish(sessionId, { type: "agentBound", agentId });
  // Hydrate the canvas from the last persisted tree for this agent.
  const state = await getCanvasState(resources, agentId, userId);
  if (state) {
    publish(sessionId, { type: "stateSnapshot", tree: state });
  }
}

export async function endSession(
  resources: Resources,
  sessionId: string,
  userId: string,
): Promise<void> {
  const session = await getSession(resources, sessionId);
  if (!session) return;
  if (session.userId !== userId) throw new Error("Forbidden");

  if (session.currentAgentId) {
    untrackBind(session.currentAgentId, sessionId);
  }

  publish(sessionId, { type: "sessionEnded" });
  closeAll(sessionId);

  await resources.ddb.entities.CanvasSession.build(DeleteItemCommand)
    .key({ sessionId })
    .send();
}

// ── Canvas state (last A2UI tree per agent) ────────────────────

export async function getCanvasState(
  resources: Resources,
  agentId: string,
  userId: string,
): Promise<CanvasTree | null> {
  const { Item } = await resources.ddb.entities.CanvasState.build(
    GetItemCommand,
  )
    .key({ agentId, userId })
    .send();
  const row = (Item ?? null) as CanvasStateItem | null;
  if (!row) return null;
  try {
    return JSON.parse(row.tree) as CanvasTree;
  } catch {
    return null;
  }
}

export async function saveCanvasState(
  resources: Resources,
  agentId: string,
  userId: string,
  root: CanvasNode,
): Promise<CanvasTree> {
  const prev = await getCanvasState(resources, agentId, userId);
  const tree: CanvasTree = {
    revision: (prev?.revision ?? 0) + 1,
    root,
  };
  const ttl =
    Math.floor(Date.now() / 1000) + CANVAS_STATE_TTL_DAYS * 24 * 60 * 60;

  await resources.ddb.entities.CanvasState.build(PutItemCommand)
    .item({
      agentId,
      userId,
      revision: tree.revision,
      tree: JSON.stringify(tree),
      updatedAt: new Date().toISOString(),
      ttl,
    })
    .send();

  publishToAgent(agentId, { type: "stateSnapshot", tree });
  return tree;
}

export async function clearCanvasState(
  resources: Resources,
  agentId: string,
  userId: string,
): Promise<void> {
  await resources.ddb.entities.CanvasState.build(DeleteItemCommand)
    .key({ agentId, userId })
    .send();
  publishToAgent(agentId, { type: "stateCleared" });
}

export const canvasService = {
  createSession,
  getSession,
  bindAgent,
  endSession,
  verifyCanvasToken,
  subscribe,
  rememberBinding,
  getCanvasState,
  saveCanvasState,
  clearCanvasState,
  TOKEN_TTL_SECONDS,
};

export type CanvasService = typeof canvasService;
