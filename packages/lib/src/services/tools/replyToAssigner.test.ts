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
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([]);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute({ message: "done" }, TOOL_OPTS);

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
        }),
      }),
    );
  });

  it("routes delegated-task replies back to the assigner (different agent)", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      ...baseTask,
      assignerAgentId: "manager-agent",
    } as any);
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([]);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute({ message: "found 2 of 3" }, TOOL_OPTS);

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
        }),
      }),
    );
  });

  it("auto-fetches task attachments and includes them in the payload", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([
      { type: "file", path: "report.md" },
      { type: "link", url: "https://example.com", title: "Dashboard" },
    ]);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute({ message: "report ready" }, TOOL_OPTS);

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "worker-agent",
      "main",
      expect.objectContaining({
        payload: expect.objectContaining({
          attachments: [
            { type: "file", path: "report.md" },
            { type: "link", url: "https://example.com", title: "Dashboard" },
          ],
        }),
      }),
    );
  });

  it("omits attachments key when task has none", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(baseTask as any);
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([]);

    const tool = replyToAssignerTool(ctx, "task-1");
    await tool.execute({ message: "done" }, TOOL_OPTS);

    const payload = (ctx.services.inbox.enqueueWork as any).mock.calls[0][3]
      .payload;
    expect(payload).not.toHaveProperty("attachments");
  });

  it("throws when task not found", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(null);

    const tool = replyToAssignerTool(ctx, "task-1");
    await expect(tool.execute({ message: "x" }, TOOL_OPTS)).rejects.toThrow(
      "Task task-1 not found",
    );
  });
});
