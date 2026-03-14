import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "../sandbox/types.js";
import {
  activeSessions,
  checkCommandTool,
  ensureSandboxTool,
  runCommandTool,
} from "./sandboxTools.js";

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

      expect(result).toEqual({ status: "ready" });
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

      expect(result).toEqual({ status: "ready" });
      expect(activeSessions.get("task-1")).toBe(session);
    });

    it("subscribes BEFORE launching on cold boot", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: undefined,
      } as any);
      ctx.services.sandbox.subscribe.mockResolvedValue(undefined as any);
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-new");
      ctx.services.agents.updateAgent.mockResolvedValue(undefined as any);

      const callOrder: string[] = [];
      ctx.services.sandbox.subscribe.mockImplementation(async () => {
        callOrder.push("subscribe");
      });
      ctx.services.sandbox.launchInstance.mockImplementation(async () => {
        callOrder.push("launchInstance");
        return "i-new";
      });

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({
        status: "booting",
        message:
          "Sandbox is booting up. You'll be notified when it's ready — stop and wait.",
      });
      expect(callOrder).toEqual(["subscribe", "launchInstance"]);
    });

    it("persists instanceId when it changes", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-old",
      } as any);
      ctx.services.sandbox.tryQuickConnect.mockResolvedValue(null);
      ctx.services.sandbox.subscribe.mockResolvedValue(undefined as any);
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-new");
      ctx.services.agents.updateAgent.mockResolvedValue(undefined as any);

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      await t.execute({}, { toolCallId: "tc1", messages: [] } as any);

      expect(ctx.services.agents.updateAgent).toHaveBeenCalledWith(
        ctx,
        "agent-1",
        { sandboxInstanceId: "i-new" },
      );
    });

    it("does not persist instanceId when unchanged", async () => {
      ctx.services.agents.getAgent.mockResolvedValue({
        sandboxInstanceId: "i-same",
      } as any);
      ctx.services.sandbox.tryQuickConnect.mockResolvedValue(null);
      ctx.services.sandbox.subscribe.mockResolvedValue(undefined as any);
      ctx.services.sandbox.launchInstance.mockResolvedValue("i-same");

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      await t.execute({}, { toolCallId: "tc1", messages: [] } as any);

      expect(ctx.services.agents.updateAgent).not.toHaveBeenCalled();
    });

    it("returns error when ensureSandbox throws", async () => {
      ctx.services.agents.getAgent.mockRejectedValue(new Error("db down"));

      const t = ensureSandboxTool(ctx, "agent-1", "task-1");
      const result = await t.execute({}, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toEqual({ status: "error", error: "db down" });
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

      expect(result).toEqual({ status: "ready" });
      expect(activeSessions.get("task-2")).toBe(session2);
      expect(activeSessions.has("task-1")).toBe(true);
    });
  });

  describe("runCommandTool", () => {
    it("returns error when no session exists for the task", async () => {
      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "echo hi" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        status: "error",
        error: expect.stringContaining("not online"),
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

      expect(result).toMatchObject({ output: "hello", exitCode: 0 });
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

      expect(result).toMatchObject({ output: "out\n\n[stderr]\nwarn" });
    });

    it("returns backgrounded status for long-running commands", async () => {
      activeSessions.set("task-1", makeSession());

      ctx.services.sandbox.execCommand.mockResolvedValue({
        output: "starting...",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        backgrounded: true,
        commandId: "cmd-bg",
      });

      const t = runCommandTool(ctx, "agent-1", "task-1");
      const result = await t.execute({ command: "long-cmd" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        status: "backgrounded",
        commandId: "cmd-bg",
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

      expect(result).toMatchObject({ exitCode: -1 });
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

  describe("checkCommandTool", () => {
    it("returns finished result with combined output", async () => {
      ctx.services.sandbox.checkCommand.mockReturnValue({
        output: "done",
        stderr: "warn",
        exitCode: 0,
        finished: true,
      });

      const t = checkCommandTool(ctx, "agent-1");
      const result = await t.execute({ commandId: "cmd-1" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        output: "done\n\n[stderr]\nwarn",
        exitCode: 0,
        finished: true,
      });
    });

    it("returns in-progress result for running commands", async () => {
      ctx.services.sandbox.checkCommand.mockReturnValue({
        output: "partial",
        stderr: "",
        exitCode: undefined,
        finished: false,
      });

      const t = checkCommandTool(ctx, "agent-1");
      const result = await t.execute({ commandId: "cmd-1" }, {
        toolCallId: "tc1",
        messages: [],
      } as any);

      expect(result).toMatchObject({
        output: "partial",
        finished: false,
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
