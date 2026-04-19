import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { dispatchTask } from "./dispatchTask.js";

const task = {
  id: "task-42",
  agentId: "agent-worker",
  title: "Ship it",
  instructions: "Draft the release notes.",
  status: "open",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as any;

describe("dispatchTask", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([]);
    ctx.services.tasks.getLatestComment.mockResolvedValue(undefined);
  });

  it("moves the task to in_progress", async () => {
    await dispatchTask(ctx, task);

    expect(ctx.services.tasks.updateTaskStatus).toHaveBeenCalledWith(
      ctx,
      "task-42",
      "in_progress",
    );
  });

  it("enqueues a run_task on the task lane with the brief as prompt", async () => {
    await dispatchTask(ctx, task);

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "agent-worker",
      "task:task-42",
      expect.objectContaining({
        type: "run_task",
        payload: expect.objectContaining({
          taskId: "task-42",
          prompt: expect.stringContaining("Draft the release notes."),
        }),
      }),
    );
  });
});
