import WebSocket from "ws";
import { createLogger } from "../../logger.js";
import type { ExecOptions } from "./shared.js";
import { COMMAND_TIMEOUT_MS, truncate } from "./shared.js";
import type { CommandResult, SandboxSession } from "./types.js";

const log = createLogger("sandbox:exec");

export type { ExecOptions };

export async function execCommand(
  session: SandboxSession,
  command: string,
  options?: ExecOptions & { env?: Record<string, string> },
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
    const startTime = Date.now();
    let stdoutBuf = "";
    let stderrBuf = "";

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();

      const durationMs = Date.now() - startTime;
      log.warn(
        { agentId: session.agentId, id, durationMs },
        "Command timed out",
      );
      resolve({
        output: truncate(stdoutBuf),
        stderr: truncate(stderrBuf),
        exitCode: -1,
        timedOut: true,
        commandId: id,
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

          if (options?.pubsub && options?.taskId) {
            options.pubsub.publish(`sandboxOutput:${options.taskId}`, {
              commandId: id,
              stream: msg.stream,
              data: msg.data,
            });
          }
        }

        if (msg.type === "exec:done") {
          clearTimeout(timer);
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
      } catch {
        // ignore parse errors
      }
    }

    function cleanup() {
      ws?.off("message", onMessage);
    }

    ws.on("message", onMessage);
    ws.send(
      JSON.stringify({
        type: "exec",
        id,
        command,
        ...(options?.env && Object.keys(options.env).length > 0
          ? { env: options.env }
          : {}),
      }),
    );
  });
}
