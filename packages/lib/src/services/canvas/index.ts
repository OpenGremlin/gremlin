import { createHash } from "node:crypto";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import {
  $remove,
  UpdateItemCommand,
} from "dynamodb-toolbox/entity/actions/update";
import * as jose from "jose";
import type { CanvasSessionItem } from "../../resources/ddb/schema/canvasSession.js";
import type { Resources } from "../../resources/index.js";

const TOKEN_TTL_SECONDS = 5 * 60;
const ISSUER = "canvas";
const ALG = "HS256";

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
  expiresAtEpoch: number,
): Promise<string> {
  return new jose.SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(expiresAtEpoch)
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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── In-memory subscribers ──────────────────────────────────────
// Single-process for v1. Multi-process scale-out would need Redis or
// SQS fan-out; revisit when the server runs >1 task.

export type CanvasEvent =
  | { type: "agentBound"; agentId: string }
  | { type: "agentUnbound" }
  | { type: "sessionEnded" }
  | { type: "heartbeat" };

export interface Subscriber {
  send: (event: CanvasEvent) => void;
  close: () => void;
}

const subscribersBySession = new Map<string, Set<Subscriber>>();

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
  for (const sub of set) {
    try {
      sub.send(event);
    } catch {
      // Subscriber will tear itself down on its own write error
    }
  }
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
  const expiresAtEpoch = now + TOKEN_TTL_SECONDS;
  const token = await mintToken(userId, sessionId, expiresAtEpoch);

  await resources.ddb.entities.CanvasSession.build(PutItemCommand)
    .item({
      sessionId,
      userId,
      tokenHash: hashToken(token),
      createdAt: new Date().toISOString(),
      expiresAtEpoch,
    })
    .send();

  return {
    sessionId,
    token,
    expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
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

  if (agentId === null) {
    await resources.ddb.entities.CanvasSession.build(UpdateItemCommand)
      .item({ sessionId, currentAgentId: $remove() })
      .send();
    publish(sessionId, { type: "agentUnbound" });
  } else {
    await resources.ddb.entities.CanvasSession.build(UpdateItemCommand)
      .item({ sessionId, currentAgentId: agentId })
      .send();
    publish(sessionId, { type: "agentBound", agentId });
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

  publish(sessionId, { type: "sessionEnded" });
  closeAll(sessionId);

  await resources.ddb.entities.CanvasSession.build(DeleteItemCommand)
    .key({ sessionId })
    .send();
}

export const canvasService = {
  createSession,
  getSession,
  bindAgent,
  endSession,
  verifyCanvasToken,
  subscribe,
  TOKEN_TTL_SECONDS,
};

export type CanvasService = typeof canvasService;
