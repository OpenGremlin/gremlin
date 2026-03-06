import WebSocket from "ws";
import { createLogger } from "../../logger.js";
import type { CommandResult, SandboxSession } from "./types.js";

const log = createLogger("sandbox:exec");
const COMMAND_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 8_000;

// Strip ANSI escape sequences so sentinel matching works through PTY color/cursor codes
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ANSI stripping
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(?:\x07|\x1b\\)|\x1b[()][0-9A-B]|\r/g;
function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, "");
}

export async function connectToSandbox(
  session: SandboxSession,
): Promise<WebSocket> {
  log.info({ agentId: session.agentId, wsUrl: session.wsUrl }, "Connecting to sandbox WebSocket");

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(session.wsUrl);
    const timeout = setTimeout(() => {
      log.error({ agentId: session.agentId, wsUrl: session.wsUrl }, "WebSocket connection timed out (15s)");
      ws.close();
      reject(new Error("WebSocket connection timed out"));
    }, 15_000);

    ws.on("open", () => {
      log.debug({ agentId: session.agentId }, "WebSocket TCP connection opened, waiting for ready signal");
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ready") {
          clearTimeout(timeout);
          session.ws = ws;
          log.info({ agentId: session.agentId }, "Sandbox WebSocket connected and ready");
          resolve(ws);
        }
      } catch {
        // ignore parse errors during handshake
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      log.error({ agentId: session.agentId, error: err.message }, "WebSocket connection error");
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
    log.error({ agentId: session.agentId, readyState: ws?.readyState }, "WebSocket not connected");
    throw new Error("Sandbox WebSocket not connected");
  }

  const sentinel = `__GREMLIN_DONE_${crypto.randomUUID()}__`;
  const wrappedCommand = `${command}; echo "${sentinel}$?__"`;

  log.info(
    { agentId: session.agentId, commandLength: command.length, commandPreview: command.slice(0, 200) },
    "Executing command",
  );

  let output = "";
  let _timedOut = false;

  return new Promise((resolve) => {
    const startTime = Date.now();

    const timeout = setTimeout(() => {
      _timedOut = true;
      cleanup();
      log.warn(
        { agentId: session.agentId, durationMs: Date.now() - startTime, outputLength: output.length },
        "Command timed out",
      );
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

          // Check for sentinel (strip ANSI codes so PTY escapes don't break the match)
          const sentinelPattern = new RegExp(
            `${sentinel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)__`,
          );
          const clean = stripAnsi(output);
          const match = clean.match(sentinelPattern);
          if (match) {
            clearTimeout(timeout);
            const exitCode = Number.parseInt(match[1], 10);
            // Strip sentinel and everything after from clean output
            output = clean.slice(0, match.index);
            cleanup();
            const durationMs = Date.now() - startTime;
            log.info(
              {
                agentId: session.agentId,
                exitCode,
                durationMs,
                outputLength: output.length,
                truncated: output.length > MAX_OUTPUT_CHARS,
              },
              "Command completed",
            );
            if (exitCode !== 0) {
              log.warn(
                { agentId: session.agentId, exitCode, outputTail: output.slice(-500) },
                "Command exited with non-zero code",
              );
            }
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
      ws?.off("message", onMessage);
    }

    ws.on("message", onMessage);

    // Send the wrapped command
    ws.send(JSON.stringify({ type: "input", data: `${wrappedCommand}\n` }));
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
