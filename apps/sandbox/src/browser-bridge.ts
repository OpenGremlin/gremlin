import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import WebSocket from "ws";
import { createLogger } from "./log.js";

const log = createLogger("browser");

const CDP_URL = "ws://localhost:9222";
const CDP_HTTP = "http://localhost:9222";

let cdpWs: WebSocket | null = null;
let cdpReqId = 1;

// ── CDP helpers ────────────────────────────────────────────

async function getCdpWsUrl(): Promise<string> {
  log.debug("Fetching CDP WebSocket URL");
  const res = await fetch(`${CDP_HTTP}/json/version`);
  const data = (await res.json()) as { webSocketDebuggerUrl: string };
  log.debug({ wsUrl: data.webSocketDebuggerUrl }, "Got CDP WebSocket URL");
  return data.webSocketDebuggerUrl;
}

async function ensureCdp(): Promise<WebSocket> {
  if (cdpWs && cdpWs.readyState === WebSocket.OPEN) return cdpWs;

  log.info("Opening CDP connection");
  const wsUrl = await getCdpWsUrl();
  cdpWs = new WebSocket(wsUrl);

  await new Promise<void>((resolve, reject) => {
    cdpWs!.once("open", resolve);
    cdpWs!.once("error", reject);
  });

  log.info("CDP connection established");
  return cdpWs;
}

function sendCdp(
  ws: WebSocket,
  method: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const id = cdpReqId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`CDP timeout: ${method}`)),
      30_000,
    );

    function onMessage(raw: WebSocket.RawData) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id === id) {
          clearTimeout(timeout);
          ws.off("message", onMessage);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result ?? {});
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.on("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Track the page target so we can send Page/Runtime commands
let pageSessionWs: WebSocket | null = null;

async function ensurePageSession(): Promise<WebSocket> {
  if (pageSessionWs && pageSessionWs.readyState === WebSocket.OPEN) {
    return pageSessionWs;
  }

  // Get the first page target
  const res = await fetch(`${CDP_HTTP}/json`);
  const targets = (await res.json()) as Array<{
    type: string;
    webSocketDebuggerUrl?: string;
  }>;
  const page = targets.find((t) => t.type === "page");
  if (!page?.webSocketDebuggerUrl) {
    // Create a new page via the browser-level CDP
    const browser = await ensureCdp();
    await sendCdp(browser, "Target.createTarget", {
      url: "about:blank",
    });
    // Re-fetch
    const res2 = await fetch(`${CDP_HTTP}/json`);
    const targets2 = (await res2.json()) as Array<{
      type: string;
      webSocketDebuggerUrl?: string;
    }>;
    const page2 = targets2.find((t) => t.type === "page");
    if (!page2?.webSocketDebuggerUrl) {
      throw new Error("No page target available");
    }
    pageSessionWs = new WebSocket(page2.webSocketDebuggerUrl);
  } else {
    pageSessionWs = new WebSocket(page.webSocketDebuggerUrl);
  }

  await new Promise<void>((resolve, reject) => {
    pageSessionWs!.once("open", resolve);
    pageSessionWs!.once("error", reject);
  });

  // Enable Page domain
  await sendCdp(pageSessionWs!, "Page.enable");

  return pageSessionWs!;
}

// ── Route handlers ─────────────────────────────────────────

async function handleStatus(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${CDP_HTTP}/json/version`);
    const data = await res.json();
    return { status: "ok", browser: data };
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function handleNavigate(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = body.url as string;
  if (!url) throw new Error("Missing 'url' parameter");

  const ws = await ensurePageSession();
  const result = await sendCdp(ws, "Page.navigate", { url });
  // Wait for load
  await sendCdp(ws, "Page.lifecycleEvent").catch(() => {});
  // Give the page a moment to settle
  await new Promise((r) => setTimeout(r, 1000));
  return result;
}

async function handleScreenshot(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ws = await ensurePageSession();
  const params: Record<string, unknown> = { format: "png" };
  if (body.fullPage) {
    // Capture full page by getting content size
    const layout = await sendCdp(ws, "Page.getLayoutMetrics");
    const contentSize = layout.contentSize as
      | { width: number; height: number }
      | undefined;
    if (contentSize) {
      params.clip = {
        x: 0,
        y: 0,
        width: contentSize.width,
        height: contentSize.height,
        scale: 1,
      };
    }
  }
  const result = await sendCdp(ws, "Page.captureScreenshot", params);
  return { data: (result as { data: string }).data };
}

async function handleClick(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ws = await ensurePageSession();

  let x: number;
  let y: number;

  if (body.selector) {
    // Find element by selector and get its center coordinates
    const docResult = await sendCdp(ws, "Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(body.selector)});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      })()`,
      returnByValue: true,
    });
    const value = (docResult as { result?: { value?: { x: number; y: number } } })
      .result?.value;
    if (!value) throw new Error(`Selector not found: ${body.selector}`);
    x = value.x;
    y = value.y;
  } else if (typeof body.x === "number" && typeof body.y === "number") {
    x = body.x;
    y = body.y;
  } else {
    throw new Error("Provide 'selector' or 'x'/'y' coordinates");
  }

  await sendCdp(ws, "Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await sendCdp(ws, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });

  return { clicked: true, x, y };
}

async function handleType(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ws = await ensurePageSession();
  const text = body.text as string;
  if (!text) throw new Error("Missing 'text' parameter");

  // Focus element if selector provided
  if (body.selector) {
    await sendCdp(ws, "Runtime.evaluate", {
      expression: `document.querySelector(${JSON.stringify(body.selector)})?.focus()`,
    });
  }

  // Type each character
  for (const char of text) {
    await sendCdp(ws, "Input.dispatchKeyEvent", {
      type: "keyDown",
      text: char,
    });
    await sendCdp(ws, "Input.dispatchKeyEvent", {
      type: "keyUp",
    });
  }

  return { typed: true, length: text.length };
}

async function handleEvaluate(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const ws = await ensurePageSession();
  const expression = body.expression as string;
  if (!expression) throw new Error("Missing 'expression' parameter");

  const result = await sendCdp(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  const evalResult = result as {
    result?: { value?: unknown; type?: string; description?: string };
    exceptionDetails?: { text?: string };
  };

  if (evalResult.exceptionDetails) {
    throw new Error(
      `JS error: ${evalResult.exceptionDetails.text ?? "Unknown error"}`,
    );
  }

  return { value: evalResult.result?.value };
}

async function handleContent(): Promise<Record<string, unknown>> {
  const ws = await ensurePageSession();
  const result = await sendCdp(ws, "Runtime.evaluate", {
    expression: "document.body?.innerText ?? ''",
    returnByValue: true,
  });

  const evalResult = result as { result?: { value?: string } };
  return { content: evalResult.result?.value ?? "" };
}

// ── HTTP server ────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function startBrowserBridge(port: number): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const { method, url } = req;
    const start = Date.now();

    log.debug({ method, url }, "Request received");

    try {
      let result: Record<string, unknown>;

      if (method === "GET" && url === "/browser/status") {
        result = await handleStatus();
      } else if (method === "POST" && url === "/browser/navigate") {
        result = await handleNavigate(await readBody(req));
      } else if (method === "POST" && url === "/browser/screenshot") {
        result = await handleScreenshot(await readBody(req));
      } else if (method === "POST" && url === "/browser/click") {
        result = await handleClick(await readBody(req));
      } else if (method === "POST" && url === "/browser/type") {
        result = await handleType(await readBody(req));
      } else if (method === "POST" && url === "/browser/evaluate") {
        result = await handleEvaluate(await readBody(req));
      } else if (method === "GET" && url === "/browser/content") {
        result = await handleContent();
      } else {
        log.warn({ method, url }, "Route not found");
        sendJson(res, 404, { error: "Not found" });
        return;
      }

      const durationMs = Date.now() - start;
      log.info({ method, url, durationMs }, "Request completed");
      sendJson(res, 200, result);
    } catch (err) {
      const durationMs = Date.now() - start;
      log.error({ method, url, durationMs, err }, "Request failed");
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  server.listen(port);
  log.info({ port }, "Browser bridge listening");
}
