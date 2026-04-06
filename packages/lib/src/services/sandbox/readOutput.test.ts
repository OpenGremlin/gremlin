import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readOutput } from "./readOutput.js";
import type { SandboxSession } from "./types.js";

function makeWs() {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    readyState: 1,
    OPEN: 1,
    send: vi.fn(),
    off: emitter.removeListener.bind(emitter),
  });
}

function makeSession(ws: ReturnType<typeof makeWs>): SandboxSession {
  return {
    instanceId: "i-test",
    privateIp: "10.0.0.1",
    wsUrl: "ws://10.0.0.1:8080",
    agentId: "agent-1",
    lastActivityAt: Date.now(),
    ws: ws as any,
  };
}

describe("readOutput", () => {
  let ws: ReturnType<typeof makeWs>;
  let session: SandboxSession;

  beforeEach(() => {
    ws = makeWs();
    session = makeSession(ws);
  });

  it("sends a readOutput message and resolves with the result", async () => {
    const promise = readOutput(session, "cmd-1", {
      stream: "stdout",
      offset: 100,
      limit: 500,
    });

    // Inspect the sent message
    expect(ws.send).toHaveBeenCalledOnce();
    const sent = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sent.type).toBe("readOutput");
    expect(sent.commandId).toBe("cmd-1");
    expect(sent.stream).toBe("stdout");
    expect(sent.offset).toBe(100);
    expect(sent.limit).toBe(500);

    // Simulate relay response
    ws.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          type: "readOutput:result",
          commandId: "cmd-1",
          stream: "stdout",
          data: "hello world",
          offset: 100,
          bytesRead: 11,
          totalBytes: 5000,
        }),
      ),
    );

    const result = await promise;
    expect(result).toEqual({
      data: "hello world",
      stream: "stdout",
      offset: 100,
      bytesRead: 11,
      totalBytes: 5000,
    });
  });

  it("rejects when relay returns an error", async () => {
    const promise = readOutput(session, "cmd-1");

    ws.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          type: "readOutput:result",
          commandId: "cmd-1",
          error: "Output file not found",
        }),
      ),
    );

    await expect(promise).rejects.toThrow("Output file not found");
  });

  it("ignores messages for other commands", async () => {
    const promise = readOutput(session, "cmd-1");

    // Message for different command — should be ignored
    ws.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          type: "readOutput:result",
          commandId: "cmd-other",
          data: "wrong",
          offset: 0,
          bytesRead: 5,
          totalBytes: 5,
        }),
      ),
    );

    // Correct response
    ws.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          type: "readOutput:result",
          commandId: "cmd-1",
          stream: "stdout",
          data: "correct",
          offset: 0,
          bytesRead: 7,
          totalBytes: 7,
        }),
      ),
    );

    const result = await promise;
    expect(result.data).toBe("correct");
  });

  it("throws when WebSocket is not connected", async () => {
    session.ws = { readyState: 3, OPEN: 1 } as any;
    await expect(readOutput(session, "cmd-1")).rejects.toThrow(
      "WebSocket not connected",
    );
  });

  it("defaults stream to stdout and offset to 0", async () => {
    const promise = readOutput(session, "cmd-1");

    const sent = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sent.stream).toBe("stdout");
    expect(sent.offset).toBe(0);

    // Resolve to avoid dangling promise
    ws.emit(
      "message",
      Buffer.from(
        JSON.stringify({
          type: "readOutput:result",
          commandId: "cmd-1",
          stream: "stdout",
          data: "",
          offset: 0,
          bytesRead: 0,
          totalBytes: 0,
        }),
      ),
    );

    await promise;
  });

  it("times out after 10 seconds", async () => {
    vi.useFakeTimers();
    const promise = readOutput(session, "cmd-1");

    vi.advanceTimersByTime(10_000);

    await expect(promise).rejects.toThrow("readOutput timed out");
    vi.useRealTimers();
  });
});
