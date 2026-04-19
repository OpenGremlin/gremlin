import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";
import { buildTaskLaneTools } from "./index.js";

const makeTask = (overrides = {}) => ({
  id: "task-1",
  agentId: "agent-1",
  title: "Write Bio: Bottoga",
  status: "open",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("taskUpdate tool", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  describe("redundant-close short-circuit", () => {
    it("skips closeTask, addComment, and enqueueWork when task is already closed", async () => {
      const alreadyClosed = makeTask({
        status: "closed",
        parentId: "epic-1",
        closedAt: "2026-01-10T00:00:00.000Z",
        closeReason: "done earlier",
      });
      ctx.services.tasks.getTask.mockResolvedValue(alreadyClosed as any);

      const tools = buildTaskLaneTools(ctx);
      const result = await tools.taskUpdate.execute?.(
        {
          taskId: "task-1",
          status: "closed",
          notes: "redundant close by epic",
        },
        {} as any,
      );

      // Returns the existing task; no side effects fired.
      expect(result).toEqual({ ok: true, data: alreadyClosed });
      expect(ctx.services.tasks.closeTask).not.toHaveBeenCalled();
      expect(ctx.services.tasks.addComment).not.toHaveBeenCalled();
      expect(ctx.services.inbox.enqueueWork).not.toHaveBeenCalled();
    });

    it("still closes + notifies when task is not yet closed", async () => {
      const openTask = makeTask({ status: "in_progress", parentId: "epic-1" });
      const closedTask = makeTask({
        status: "closed",
        parentId: "epic-1",
        closedAt: "2026-01-15T00:00:00.000Z",
      });
      const parent = makeTask({ id: "epic-1", agentId: "epic-agent" });

      // First getTask: short-circuit check (still open → proceed).
      // Then the close path re-fetches for parent-notification routing.
      ctx.services.tasks.getTask
        .mockResolvedValueOnce(openTask as any)
        .mockResolvedValueOnce(closedTask as any)
        .mockResolvedValueOnce(parent as any)
        .mockResolvedValueOnce(closedTask as any);

      const tools = buildTaskLaneTools(ctx);
      await tools.taskUpdate.execute?.(
        { taskId: "task-1", status: "closed", notes: "done" },
        {} as any,
      );

      expect(ctx.services.tasks.closeTask).toHaveBeenCalledWith(
        ctx,
        "task-1",
        "done",
      );
      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "epic-agent",
        "task:epic-1",
        expect.objectContaining({ type: "task_ready_for_review" }),
      );
    });
  });
});

describe("taskCreate tool", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  const newTask = makeTask({
    id: "task-new",
    agentId: "agent-1",
    title: "New thing",
    instructions: "Do it",
  });

  beforeEach(() => {
    ctx = createMockContext();
    ctx.services.tasks.createTask.mockResolvedValue(newTask as any);
  });

  it("dispatches the new task immediately when there are no blockers", async () => {
    const tools = buildTaskLaneTools(ctx, "parent-task");
    await tools.taskCreate.execute?.(
      {
        title: "New thing",
        instructions: "Do it",
        assignee: "agent-1",
        emoji: "🆕",
      },
      {} as any,
    );

    // Dispatch should happen through the orchestrator helper, not reconciler.
    expect(ctx.services.orchestrator.dispatchTask).toHaveBeenCalledWith(
      ctx,
      newTask,
    );
    expect(ctx.services.tasks.addTaskDep).not.toHaveBeenCalled();
  });

  it("does NOT dispatch when the task has blockers — reconciler handles it later", async () => {
    const tools = buildTaskLaneTools(ctx, "parent-task");
    await tools.taskCreate.execute?.(
      {
        title: "Blocked",
        instructions: "Wait for upstream",
        assignee: "agent-1",
        emoji: "⏳",
        blockedBy: ["dep-1", "dep-2"],
      },
      {} as any,
    );

    expect(ctx.services.orchestrator.dispatchTask).not.toHaveBeenCalled();
    // Both deps should have been recorded.
    expect(ctx.services.tasks.addTaskDep).toHaveBeenCalledTimes(2);
  });
});
