import WebSocket from "ws";
import type { CommandResult, SandboxSession } from "./types.js";

const COMMAND_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 8_000;

export async function connectToSandbox(
  session: SandboxSession,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(session.wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timed out"));
    }, 15_000);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ready") {
          clearTimeout(timeout);
          session.ws = ws;
          resolve(ws);
        }
      } catch {
        // ignore parse errors during handshake
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function execCommand(
  session: SandboxSession,
  command: string,
): Promise<CommandResult> {
  const ws = session.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Sandbox WebSocket not connected");
  }

  const sentinel = `__GREMLIN_DONE_${crypto.randomUUID()}__`;
  const wrappedCommand = `${command}; echo "${sentinel}$?__"`;

  let output = "";
  let timedOut = false;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      timedOut = true;
      cleanup();
      resolve({
        output: truncate(output),
        exitCode: -1,
        timedOut: true,
      });
    }, COMMAND_TIMEOUT_MS);

    function onMessage(raw: Buffer) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "output" && typeof msg.data === "string") {
          output += msg.data;

          // Check for sentinel
          const sentinelPattern = new RegExp(
            `${sentinel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)__`,
          );
          const match = output.match(sentinelPattern);
          if (match) {
            clearTimeout(timeout);
            const exitCode = Number.parseInt(match[1], 10);
            // Strip sentinel and everything after from output
            output = output.slice(0, match.index);
            cleanup();
            resolve({
              output: truncate(output),
              exitCode,
              timedOut: false,
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    function cleanup() {
      ws!.off("message", onMessage);
    }

    ws.on("message", onMessage);

    // Send the wrapped command
    ws.send(JSON.stringify({ type: "input", data: wrappedCommand + "\n" }));
  });
}

function truncate(s: string): string {
  if (s.length <= MAX_OUTPUT_CHARS) return s;
  return (
    s.slice(0, MAX_OUTPUT_CHARS / 2) +
    "\n... [output truncated] ...\n" +
    s.slice(-MAX_OUTPUT_CHARS / 2)
  );
}
