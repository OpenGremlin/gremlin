import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { replyToAssignerTool } from "./replyToAssigner.js";

const TOOL_OPTS = {
  toolCallId: "tc-1",
  messages: [],
  abortSignal: new AbortController().signal,
};

const baseTask = {
  id: "task-1",
  agentId: "worker-agent",
  title: "Test Task",
  message: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
  originJobId: null,
  emoji: null,
  attachments: [],
};

describe("replyToAssignerTool", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("routes background-task replies back to the worker's own main lane", async () => {
    // Background task: no assignerAgentId on the row → fall back to worker.
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute(
      { message: "done", kind: "final", final: true },
      TOOL_OPTS,
    );

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "worker-agent",
      "main",
      expect.objectContaining({
        type: "task_update",
        payload: expect.objectContaining({
          taskId: "task-1",
          fromAgentId: "worker-agent",
          message: "done",
          kind: "final",
          isFinal: true,
        }),
      }),
    );
  });

  it("routes delegated-task replies back to the assigner (different agent)", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...baseTask,
      assignerAgentId: "manager-agent",
    } as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute(
      { message: "found 2 of 3", kind: "progress", final: false },
      TOOL_OPTS,
    );

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "manager-agent",
      "main",
      expect.objectContaining({
        type: "task_update",
        payload: expect.objectContaining({
          taskId: "task-1",
          fromAgentId: "worker-agent",
          message: "found 2 of 3",
          kind: "progress",
          isFinal: false,
        }),
      }),
    );
  });

  it("calls completeTask when final=true", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute(
      { message: "all done", kind: "progress", final: true },
      TOOL_OPTS,
    );

    expect(ctx.services.tasks.completeTask).toHaveBeenCalledWith(ctx, "task-1");
  });

  it("calls completeTask when kind=final even if final=false", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    const result = await tool.execute(
      { message: "wrapping up", kind: "final", final: false },
      TOOL_OPTS,
    );

    expect(ctx.services.tasks.completeTask).toHaveBeenCalledWith(ctx, "task-1");
    expect(result).toMatchObject({ sent: true, isFinal: true });
  });

  it("does not call completeTask for progress messages", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute(
      { message: "still working", kind: "progress", final: false },
      TOOL_OPTS,
    );

    expect(ctx.services.tasks.completeTask).not.toHaveBeenCalled();
  });

  it("throws when task not found", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(null);

    const tool = replyToAssignerTool(ctx, "task-1");
    await expect(
      tool.execute({ message: "x", kind: "final", final: true }, TOOL_OPTS),
    ).rejects.toThrow("Task task-1 not found");
  });

  it("forwards attachments through to the inbox payload", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute(
      {
        message: "report ready",
        kind: "final",
        final: true,
        attachments: [{ type: "file", path: "report.md" }],
      },
      TOOL_OPTS,
    );

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "worker-agent",
      "main",
      expect.objectContaining({
        payload: expect.objectContaining({
          attachments: [{ type: "file", path: "report.md" }],
        }),
      }),
    );
  });
});
