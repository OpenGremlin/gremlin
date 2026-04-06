import WebSocket from "ws";
import type { ReadOutputResult, SandboxSession } from "./types.js";

const READ_TIMEOUT_MS = 10_000;

export interface ReadOutputOptions {
  stream?: "stdout" | "stderr";
  offset?: number;
  limit?: number;
}

export async function readOutput(
  session: SandboxSession,
  commandId: string,
  options?: ReadOutputOptions,
): Promise<ReadOutputResult> {
  const ws = session.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("WebSocket not connected");
  }

  const stream = options?.stream ?? "stdout";
  const offset = options?.offset ?? 0;

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("readOutput timed out"));
    }, READ_TIMEOUT_MS);

    function onMessage(raw: Buffer) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type !== "readOutput:result" || msg.commandId !== commandId)
          return;

        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();

        if (msg.error) {
          reject(new Error(msg.error));
          return;
        }

        resolve({
          data: msg.data,
          stream: msg.stream ?? stream,
          offset: msg.offset ?? offset,
          bytesRead: msg.bytesRead,
          totalBytes: msg.totalBytes,
        });
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
        type: "readOutput",
        commandId,
        stream,
        offset,
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      }),
    );
  });
}
