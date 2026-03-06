import WebSocket from "ws";
import { createLogger } from "../../logger.js";
import type { PubSub } from "../../resources/pubsub.js";
import type {
  BackgroundCommand,
  CommandResult,
  SandboxSession,
} from "./types.js";

const log = createLogger("sandbox:exec");
const SOFT_TIMEOUT_MS = 30_000;
const HARD_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 8_000;

export interface ExecOptions {
  pubsub?: PubSub;
  taskId?: string;
}

// In-memory background task tracking, keyed by command id
const backgroundCommands = new Map<string, BackgroundCommand>();

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

export async function execCommand(
  session: SandboxSession,
  command: string,
  options?: ExecOptions,
): Promise<CommandResult> {
  const ws = session.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log.error(
      { agentId: session.agentId, readyState: ws?.readyState },
      "WebSocket not connected",
    );
    throw new Error("Sandbox WebSocket not connected");
  }

  const id = crypto.randomUUID();

  log.info(
    {
      agentId: session.agentId,
      id,
      commandLength: command.length,
      commandPreview: command.slice(0, 200),
    },
    "Executing command via exec mode",
  );

  return new Promise((resolve) => {
    let settled = false;
    let backgrounded = false;
    const startTime = Date.now();
    let stdoutBuf = "";
    let stderrBuf = "";

    // Soft timeout: background the command and return to the model
    const softTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      backgrounded = true;

      const bg: BackgroundCommand = {
        id,
        command,
        agentId: session.agentId,
        startTime,
        stdout: stdoutBuf,
        stderr: stderrBuf,
        done: false,
      };
      backgroundCommands.set(id, bg);

      const durationMs = Date.now() - startTime;
      log.info(
        {
          agentId: session.agentId,
          id,
          durationMs,
          stdoutLength: stdoutBuf.length,
        },
        "Command auto-backgrounded at soft timeout",
      );

      resolve({
        output: truncate(stdoutBuf),
        stderr: truncate(stderrBuf),
        exitCode: -1,
        timedOut: false,
        backgrounded: true,
        commandId: id,
        durationMs,
      });
      // Note: onMessage listener stays attached to keep accumulating output
    }, SOFT_TIMEOUT_MS);

    // Hard timeout: kill the process
    const hardTimer = setTimeout(() => {
      if (settled && !backgrounded) return;
      cleanup();

      const durationMs = Date.now() - startTime;

      if (!settled) {
        // Never got soft-timeout either (shouldn't happen since soft < hard, but safety)
        settled = true;
        log.warn(
          { agentId: session.agentId, id, durationMs },
          "Command hit hard timeout",
        );
        resolve({
          output: truncate(stdoutBuf),
          stderr: truncate(stderrBuf),
          exitCode: -1,
          timedOut: true,
          durationMs,
        });
      } else {
        // Was backgrounded, now finishing due to hard timeout
        const bg = backgroundCommands.get(id);
        if (bg) {
          bg.done = true;
          bg.exitCode = -1;
          bg.stdout = stdoutBuf;
          bg.stderr = stderrBuf;
          log.warn(
            { agentId: session.agentId, id, durationMs },
            "Backgrounded command hit hard timeout",
          );
        }
      }
    }, HARD_TIMEOUT_MS);

    function onMessage(raw: Buffer) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id !== id) return;

        if (msg.type === "exec:output") {
          if (msg.stream === "stdout") stdoutBuf += msg.data;
          if (msg.stream === "stderr") stderrBuf += msg.data;

          if (options?.pubsub && options?.taskId) {
            options.pubsub.publish(`sandboxOutput:${options.taskId}`, {
              commandId: id,
              stream: msg.stream,
              data: msg.data,
            });
          }
        }

        if (msg.type === "exec:done") {
          clearTimeout(softTimer);
          clearTimeout(hardTimer);
          cleanup();

          const durationMs = Date.now() - startTime;
          const exitCode = msg.exitCode ?? -1;
          const finalStdout = msg.stdout ?? stdoutBuf;
          const finalStderr = msg.stderr ?? stderrBuf;

          log.info(
            {
              agentId: session.agentId,
              id,
              exitCode,
              durationMs,
              stdoutLength: finalStdout.length,
              stderrLength: finalStderr.length,
              backgrounded,
              fullOutputPath: msg.fullOutputPath,
            },
            "Command completed",
          );

          if (exitCode !== 0) {
            log.warn(
              {
                agentId: session.agentId,
                id,
                exitCode,
                stderrTail: finalStderr.slice(-500),
              },
              "Command exited with non-zero code",
            );
          }

          // Publish a done signal so the frontend stops streaming
          if (options?.pubsub && options?.taskId) {
            options.pubsub.publish(`sandboxOutput:${options.taskId}`, {
              commandId: id,
              stream: "stdout",
              data: "",
              done: true,
              exitCode,
            });
          }

          if (backgrounded) {
            // Update background task state for checkCommand to read
            const bg = backgroundCommands.get(id);
            if (bg) {
              bg.done = true;
              bg.exitCode = exitCode;
              bg.stdout = finalStdout;
              bg.stderr = finalStderr;
            }
          } else {
            // Not backgrounded yet — resolve the promise directly
            settled = true;
            resolve({
              output: truncate(finalStdout),
              stderr: truncate(finalStderr),
              exitCode,
              timedOut: false,
              commandId: id,
              durationMs,
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
    ws.send(JSON.stringify({ type: "exec", id, command }));
  });
}

export function checkCommand(commandId: string): {
  output: string;
  stderr: string;
  exitCode: number;
  finished: boolean;
} {
  const bg = backgroundCommands.get(commandId);
  if (!bg) {
    return {
      output: "",
      stderr: "Unknown command ID",
      exitCode: -1,
      finished: true,
    };
  }

  if (bg.done) {
    backgroundCommands.delete(commandId);
    return {
      output: truncate(bg.stdout),
      stderr: truncate(bg.stderr),
      exitCode: bg.exitCode ?? -1,
      finished: true,
    };
  }

  return {
    output: truncate(bg.stdout),
    stderr: truncate(bg.stderr),
    exitCode: -1,
    finished: false,
  };
}

function truncate(s: string): string {
  if (s.length <= MAX_OUTPUT_CHARS) return s;
  return (
    s.slice(0, MAX_OUTPUT_CHARS / 2) +
    "\n... [output truncated] ...\n" +
    s.slice(-MAX_OUTPUT_CHARS / 2)
  );
}
