import { createLogger } from "../../logger.js";
import type { BrowserSession } from "./types.js";

const log = createLogger("sandbox:browser");
const BROWSER_BRIDGE_PORT = 9090;
const TIMEOUT_MS = 30_000;

function browserUrl(session: BrowserSession, path: string): string {
  return `http://${session.privateIp}:${BROWSER_BRIDGE_PORT}${path}`;
}

async function browserFetch(
  session: BrowserSession,
  path: string,
  options?: RequestInit,
): Promise<Record<string, unknown>> {
  const url = browserUrl(session, path);
  const start = Date.now();

  log.info({ agentId: session.agentId, path, method: options?.method ?? "GET" }, "Browser bridge request");

  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  const data = (await res.json()) as Record<string, unknown>;
  const durationMs = Date.now() - start;

  if (!res.ok) {
    log.error({ agentId: session.agentId, path, status: res.status, durationMs, error: data.error }, "Browser bridge request failed");
    throw new Error(
      (data.error as string) ?? `Browser bridge error: ${res.status}`,
    );
  }

  log.info({ agentId: session.agentId, path, status: res.status, durationMs }, "Browser bridge request completed");
  return data;
}

export async function browserStatus(
  session: BrowserSession,
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/status");
}

export async function browserNavigate(
  session: BrowserSession,
  url: string,
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/navigate", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function browserScreenshot(
  session: BrowserSession,
  opts?: { fullPage?: boolean },
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/screenshot", {
    method: "POST",
    body: JSON.stringify(opts ?? {}),
  });
}

export async function browserClick(
  session: BrowserSession,
  target: { selector?: string; x?: number; y?: number },
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/click", {
    method: "POST",
    body: JSON.stringify(target),
  });
}

export async function browserType(
  session: BrowserSession,
  params: { selector?: string; text: string },
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/type", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function browserEvaluate(
  session: BrowserSession,
  expression: string,
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/evaluate", {
    method: "POST",
    body: JSON.stringify({ expression }),
  });
}

export async function browserGetContent(
  session: BrowserSession,
): Promise<Record<string, unknown>> {
  return browserFetch(session, "/browser/content");
}
