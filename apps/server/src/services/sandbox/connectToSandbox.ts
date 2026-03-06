import WebSocket from "ws";
import { createLogger } from "../../logger.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:exec");

export async function connectToSandbox(
  session: SandboxSession,
): Promise<WebSocket> {
  log.info(
    { agentId: session.agentId, wsUrl: session.wsUrl },
    "Connecting to sandbox WebSocket",
  );

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(session.wsUrl);
    const timeout = setTimeout(() => {
      log.error(
        { agentId: session.agentId, wsUrl: session.wsUrl },
        "WebSocket connection timed out (15s)",
      );
      ws.close();
      reject(new Error("WebSocket connection timed out"));
    }, 15_000);

    ws.on("open", () => {
      log.debug(
        { agentId: session.agentId },
        "WebSocket TCP connection opened, waiting for ready signal",
      );
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ready") {
          clearTimeout(timeout);
          session.ws = ws;
          log.info(
            { agentId: session.agentId },
            "Sandbox WebSocket connected and ready",
          );
          resolve(ws);
        }
      } catch {
        // ignore parse errors during handshake
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      log.error(
        { agentId: session.agentId, error: err.message },
        "WebSocket connection error",
      );
      reject(err);
    });
  });
}
