import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";
import type { SandboxSession } from "../../sandbox/types.js";
import {
  activeSessions,
  ensureSandboxTool,
  readCommandOutputTool,
  runCommandTool,
} from "./index.js";

function makeSession(overrides: Partial<SandboxSession> = {}): SandboxSession {
  return {
    instanceId: "i-abc",
    privateIp: "10.0.0.1",
    wsUrl: "ws://10.0.0.1:8080",
    agentId: "agent-1",
    lastActivityAt: Date.now(),
    ws: { readyState: 1, OPEN: 1, close: vi.fn() } as any,
    ...overrides,
  };
}

describe("sandboxTools", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    activeSessions.clear();
  });

  afterEach(() => {
    activeSessions.clear();
  });

  describe("ensureSandboxTool", () => {
    it("returns ready when session already exists for this task", async () => {
      activeSessions.set("task-1", makeSession());

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({ ok: true, data: { status: "ready" } });
    });

    it("returns ready after quick-connecting to a running instance", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-existing",
      } as any);

      const session = makeSession({ instanceId: "i-existing" });
      ctx.services.sandbox.tryQuickConnect.mockResolvedValue(session);
      ctx.services.sandbox.connectToSandbox.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({ ok: true, data: { status: "ready" } });
      expect(activeSessions.get("task-1")).toBe(session);
    });

    it("blocks and polls on cold boot until sandbox is healthy", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: undefined,
      } as any);
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-new");
      ctx.services.agents.updateAgent.mockResolvedValue(undefined as any);

      // First tryQuickConnect returns null (not ready), second returns session
      const session = makeSession({ instanceId: "i-new" });
      let pollCount = 0;
      ctx.services.sandbox.tryQuickConnect.mockImplementation(async () => {
        pollCount++;
        return pollCount >= 2 ? session : null;
      });
      ctx.services.sandbox.connectToSandbox.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({ ok: true, data: { status: "ready" } });
      expect(activeSessions.get("task-1")).toBe(session);
      expect(pollCount).toBeGreaterThanOrEqual(2);
    }, 10_000);

    it("persists instanceId when it changes", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-old",
      } as any);
      ctx.services.sandbox.tryQuickConnect
        .mockResolvedValueOnce(null) // quick connect fails
        .mockResolvedValueOnce(makeSession({ instanceId: "i-new" })); // poll succeeds
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-new");
      ctx.services.agents.updateAgent.mockResolvedValue(undefined as any);
      ctx.services.sandbox.connectToSandbox.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      await t.execute({}, { toolCallId: "tc1", messages: [] } as any);

      expect(ctx.services.agents.updateAgent).toHaveBeenCalledWith(
        ctx,
        "agent-1",
        { sandboxInstanceId: "i-new" },
      );
    }, 10_000);

    it("does not persist instanceId when unchanged", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-same",
      } as any);
      ctx.services.sandbox.tryQuickConnect
        .mockResolvedValueOnce(null) // quick connect fails
        .mockResolvedValueOnce(makeSession({ instanceId: "i-same" })); // poll succeeds
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-same");
      ctx.services.sandbox.connectToSandbox.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      await t.execute({}, { toolCallId: "tc1", messages: [] } as any);

      expect(ctx.services.agents.updateAgent).not.toHaveBeenCalled();
    }, 10_000);

    it("returns error when ensureSandbox throws", async () => {
      ctx.services.agents.getAgent.mockRejectedValue(new Error("db down"));

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "db down",
        },
      });
    });

    it("does not share sessions between tasks for the same agent", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-abc",
      } as any);
      const session2 = makeSession();
      ctx.services.sandbox.tryQuickConnect.mockResolvedValue(session2);
      ctx.services.sandbox.connectToSandbox.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-2");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({ ok: true, data: { status: "ready" } });
      expect(activeSessions.get("task-2")).toBe(session2);
      expect(activeSessions.has("task-1")).toBe(true);
    });
  });

  describe("runCommandTool", () => {
    it("returns INVALID_INPUT when no session exists for the task", async () => {
      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "echo hi" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: false,
        error: { code: "INVALID_INPUT" },
      });
    });

    it("executes command on the task's session", async () => {
      const session = makeSession();
      activeSessions.set("task-1", session);

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "hello",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        commandId: "cmd-1",
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "echo hello" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: { output: "hello", exitCode: 0 },
      });
      expect(ctx.services.sandbox.execCommand).toHaveBeenCalledWith(
        session,
        "echo hello",
        expect.objectContaining({ taskId: "task-1" }),
      );
    });

    it("includes stderr in output when present", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "out",
        stderr: "warn",
        exitCode: 0,
        timedOut: false,
        commandId: "cmd-1",
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "cmd" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: { output: "out\n\n[stderr]\nwarn" },
      });
    });

    it("puts stderr first when exit code is non-zero", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "build output",
        stderr: "error: not found",
        exitCode: 1,
        timedOut: false,
        commandId: "cmd-1",
        durationMs: 100,
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "make" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: {
          output: "[stderr]\nerror: not found\n\n[stdout]\nbuild output",
          exitCode: 1,
        },
      });
    });

    it("limits output to first N lines with maxLines", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "line1\nline2\nline3\nline4\nline5",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        commandId: "cmd-1",
        durationMs: 50,
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "ls", maxLines: 2 }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: {
          output: "line1\nline2\n... [3 more lines, 5 total]",
          linesLimited: true,
        },
      });
    });

    it("limits output to last N lines with tail", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "line1\nline2\nline3\nline4\nline5",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        commandId: "cmd-1",
        durationMs: 50,
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "tail log", tail: 2 }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: {
          output: "... [3 lines hidden, showing last 2]\nline4\nline5",
          linesLimited: true,
        },
      });
    });

    it("removes session on connection error", async () => {
      activeSessions.set("task-1", makeSession());
      ctx.services.sandbox.execCommand.mockRejectedValue(
        new Error("ws closed"),
      );

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "echo hi" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "ws closed" },
      });
      expect(activeSessions.has("task-1")).toBe(false);
    });

    it("passes skill env to execCommand", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        commandId: "cmd-1",
      });

      const envProvider = () => ({ API_KEY: "secret" });
      const t = runCommandTool(ctx, "agent-1", "task-1", envProvider);
      await t.execute({ command: "cmd" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(ctx.services.sandbox.execCommand).toHaveBeenCalledWith(
        expect.anything(),
        "cmd",
        expect.objectContaining({ env: { API_KEY: "secret" } }),
      );
    });
  });

  describe("readCommandOutputTool", () => {
    it("returns INVALID_INPUT when no session exists", async () => {
      const t = readCommandOutputTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ commandId: "cmd-1" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: false,
        error: { code: "INVALID_INPUT" },
      });
    });

    it("returns paginated output from sandbox", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.readOutput.mockResolvedValue({
        data: "line 5\nline 6\n",
        stream: "stdout",
        offset: 500,
        bytesRead: 14,
        totalBytes: 10000,
      });

      const t = readCommandOutputTool(ctx, "agent-1", "task-1");
      const result = await t.execute(
        { commandId: "cmd-1", offset: 500, limit: 1000 },
        { toolCallId: "tc1", messages: [] } as any,
      );

      expect(result).toMatchObject({
        ok: true,
        data: {
          data: "line 5\nline 6\n",
          offset: 500,
          bytesRead: 14,
          totalBytes: 10000,
        },
      });

      expect(ctx.services.sandbox.readOutput).toHaveBeenCalledWith(
        expect.anything(),
        "cmd-1",
        expect.objectContaining({ offset: 500, limit: 1000 }),
      );
    });

    it("reads stderr when stream param is stderr", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.readOutput.mockResolvedValue({
        data: "error msg",
        stream: "stderr",
        offset: 0,
        bytesRead: 9,
        totalBytes: 9,
      });

      const t = readCommandOutputTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ commandId: "cmd-1", stream: "stderr" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: true,
        data: { data: "error msg", stream: "stderr" },
      });
    });

    it("returns error when readOutput throws", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.readOutput.mockRejectedValue(
        new Error("Output file not found"),
      );

      const t = readCommandOutputTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ commandId: "cmd-1" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Output file not found",
        },
      });
    });
  });

  describe("activeSessions keyed by taskId", () => {
    it("isolates sessions between tasks on the same agent", () => {
      const s1 = makeSession();
      const s2 = makeSession();

      activeSessions.set("task-1", s1);
      activeSessions.set("task-2", s2);

      expect(activeSessions.get("task-1")).toBe(s1);
      expect(activeSessions.get("task-2")).toBe(s2);
      expect(activeSessions.size).toBe(2);
    });

    it("allows deleting one task session without affecting others", () => {
      activeSessions.set("task-1", makeSession());
      activeSessions.set("task-2", makeSession());

      activeSessions.delete("task-1");

      expect(activeSessions.has("task-1")).toBe(false);
      expect(activeSessions.has("task-2")).toBe(true);
    });
  });
});
