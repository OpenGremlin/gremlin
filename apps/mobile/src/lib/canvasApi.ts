import { getToken } from "./auth";
import { getApiUrl } from "./config";

export interface CanvasSessionInfo {
  sessionId: string;
  token: string;
  expiresAt: string; // ISO 8601
  /** URL the user opens in a browser to view this session. Built by
   *  the server so the canvas origin is configurable server-side. */
  browserUrl: string;
  /** Where this session is being shown — "Living Room TV" (Cast),
   *  "Browser", etc. Set by the caller, not the backend. */
  targetLabel: string;
  /** Currently bound agent. Mutable via /bind. Local-only mirror; the
   *  backend is the source of truth. */
  currentAgentId: string | null;
}

const sessionsByid = new Map<string, CanvasSessionInfo>();

export function getActiveSession(sessionId: string): CanvasSessionInfo | null {
  return sessionsByid.get(sessionId) ?? null;
}

function setActiveSession(s: CanvasSessionInfo): void {
  sessionsByid.set(s.sessionId, s);
}

function dropActiveSession(sessionId: string): void {
  sessionsByid.delete(sessionId);
}

async function authedHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function createCanvasSession(
  targetLabel: string,
): Promise<CanvasSessionInfo> {
  const res = await fetch(`${getApiUrl()}/canvas/sessions`, {
    method: "POST",
    headers: await authedHeaders(),
  });
  if (!res.ok) {
    throw new Error(`createCanvasSession failed: ${res.status}`);
  }
  const body = (await res.json()) as {
    sessionId: string;
    token: string;
    expiresAt: string;
    browserUrl: string;
  };
  const info: CanvasSessionInfo = {
    ...body,
    targetLabel,
    currentAgentId: null,
  };
  setActiveSession(info);
  return info;
}

export async function bindCanvasAgent(
  sessionId: string,
  agentId: string | null,
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/canvas/sessions/${encodeURIComponent(sessionId)}/bind`,
    {
      method: "POST",
      headers: await authedHeaders(),
      body: JSON.stringify({ agentId }),
    },
  );
  if (!res.ok) throw new Error(`bindCanvasAgent failed: ${res.status}`);
  const cur = sessionsByid.get(sessionId);
  if (cur) setActiveSession({ ...cur, currentAgentId: agentId });
}

export async function endCanvasSession(sessionId: string): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/canvas/sessions/${encodeURIComponent(sessionId)}/end`,
    { method: "POST", headers: await authedHeaders() },
  );
  // 404 means already cleaned up — treat as success.
  if (!res.ok && res.status !== 404) {
    throw new Error(`endCanvasSession failed: ${res.status}`);
  }
  dropActiveSession(sessionId);
}
