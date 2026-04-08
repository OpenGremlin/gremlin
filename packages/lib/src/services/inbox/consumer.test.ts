import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { _formatAndWriteTaskUpdate } from "./consumer.js";

const baseTask = {
  id: "task-1",
  agentId: "worker",
  title: "Find Q4 pricing",
  message: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
  originJobId: null,
  emoji: null,
  attachments: [],
};

describe("_formatAndWriteTaskUpdate", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("writes an AGENT-role log entry with no attribution for self (background) tasks", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    await _formatAndWriteTaskUpdate(ctx, "worker", {
      taskId: "task-1",
      fromAgentId: "worker",
      message: "done — report attached",
      kind: "final",
      isFinal: true,
    });

    expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        agentId: "worker",
        taskId: null,
        role: "AGENT",
        content: "done — report attached",
      }),
    );
  });

  it("prefixes the message with [from @name] for cross-agent delegations", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...baseTask,
      assignerAgentId: "manager",
    } as any);
    ctx.services.agents.getAgent.mockResolvedValue({
      id: "worker",
      name: "Researcher",
    } as any);

    await _formatAndWriteTaskUpdate(ctx, "manager", {
      taskId: "task-1",
      fromAgentId: "worker",
      message: "found 2 of 3",
      kind: "progress",
      isFinal: false,
    });

    expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        agentId: "manager",
        taskId: null,
        role: "AGENT",
        content: "[from @Researcher]\nfound 2 of 3",
      }),
    );
  });

  it("falls back to the fromAgentId when the agent record is missing", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...baseTask,
      assignerAgentId: "manager",
    } as any);
    ctx.services.agents.getAgent.mockResolvedValue(null);

    await _formatAndWriteTaskUpdate(ctx, "manager", {
      taskId: "task-1",
      fromAgentId: "worker",
      message: "found something",
      kind: "progress",
      isFinal: false,
    });

    expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        content: "[from @worker]\nfound something",
      }),
    );
  });

  it("tolerates a thrown getAgent and still writes with the fromAgentId", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...baseTask,
      assignerAgentId: "manager",
    } as any);
    ctx.services.agents.getAgent.mockRejectedValue(new Error("DDB outage"));

    await _formatAndWriteTaskUpdate(ctx, "manager", {
      taskId: "task-1",
      fromAgentId: "worker",
      message: "x",
      kind: "progress",
      isFinal: false,
    });

    expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        content: "[from @worker]\nx",
      }),
    );
  });

  it("forwards attachments to the agent log entry", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    await _formatAndWriteTaskUpdate(ctx, "worker", {
      taskId: "task-1",
      fromAgentId: "worker",
      message: "report ready",
      kind: "final",
      isFinal: true,
      attachments: [{ type: "file", path: "report.md" }],
    });

    expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        attachments: [{ type: "file", path: "report.md" }],
      }),
    );
  });

  it("logs a warning and returns early when the task is missing", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(null);

    await _formatAndWriteTaskUpdate(ctx, "worker", {
      taskId: "missing",
      fromAgentId: "worker",
      message: "x",
      kind: "final",
      isFinal: true,
    });

    expect(ctx.services.orchestrator.writeAgentLog).not.toHaveBeenCalled();
    expect(ctx.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "missing" }),
      expect.stringContaining("unknown task"),
    );
  });
});
