import WebSocket from "ws";
import { createLogger } from "../../logger.js";
import type { CommandResult, SandboxSession } from "./types.js";

const log = createLogger("sandbox:exec");
const COMMAND_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 8_000;

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

  const id = crypto.randomUUID();

  log.info(
    { agentId: session.agentId, id, commandLength: command.length, commandPreview: command.slice(0, 200) },
    "Executing command via exec mode",
  );

  return new Promise((resolve) => {
    let settled = false;
    const startTime = Date.now();
    let stdoutBuf = "";
    let stderrBuf = "";

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      const durationMs = Date.now() - startTime;
      log.warn(
        { agentId: session.agentId, id, durationMs, stdoutLength: stdoutBuf.length, stderrLength: stderrBuf.length },
        "Command timed out",
      );
      resolve({
        output: truncate(stdoutBuf),
        stderr: truncate(stderrBuf),
        exitCode: -1,
        timedOut: true,
        durationMs,
      });
    }, COMMAND_TIMEOUT_MS);

    function onMessage(raw: Buffer) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id !== id) return;

        if (msg.type === "exec:output") {
          if (msg.stream === "stdout") stdoutBuf += msg.data;
          if (msg.stream === "stderr") stderrBuf += msg.data;
        }

        if (msg.type === "exec:done") {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          cleanup();
          const durationMs = Date.now() - startTime;
          const exitCode = msg.exitCode ?? -1;

          log.info(
            {
              agentId: session.agentId,
              id,
              exitCode,
              durationMs,
              stdoutLength: (msg.stdout ?? stdoutBuf).length,
              stderrLength: (msg.stderr ?? stderrBuf).length,
              fullOutputPath: msg.fullOutputPath,
            },
            "Command completed",
          );

          if (exitCode !== 0) {
            log.warn(
              { agentId: session.agentId, id, exitCode, stderrTail: (msg.stderr ?? stderrBuf).slice(-500) },
              "Command exited with non-zero code",
            );
          }

          resolve({
            output: truncate(msg.stdout ?? stdoutBuf),
            stderr: truncate(msg.stderr ?? stderrBuf),
            exitCode,
            timedOut: false,
            durationMs,
          });
        }
      } catch {
        // ignore parse errors
      }
    }

    function cleanup() {
      ws?.off("message", onMessage);
    }

    ws.on("message", onMessage);
    ws.send(JSON.stringify({ type: "exec", id, command }));
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
