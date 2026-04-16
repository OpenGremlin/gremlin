import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { reconcile } from "./reconcileTasks.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    agentId: "agent-worker",
    title: "Test task",
    message: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    originJobId: null,
    status: "open",
    ...overrides,
  };
}

describe("reconcileTasks", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();

    // Defaults — individual tests override as needed.
    ctx.services.tasks.getReadyWork.mockResolvedValue([]);
    ctx.services.tasks.listTasks.mockResolvedValue([]);
    ctx.services.tasks.getChildren.mockResolvedValue([]);
    ctx.services.tasks.getTask.mockResolvedValue(undefined);
    ctx.services.agents.getAgent.mockResolvedValue({ id: "agent-1" });
    ctx.services.inbox.enqueueWork.mockResolvedValue({
      id: "inbox-1",
      createdAt: "t",
    });
  });

  // ── tasks_need_assignment ─────────────────────────────────────────

  describe("tasks_need_assignment routing", () => {
    it("routes to epic lane when unassigned tasks have a parent", async () => {
      const unassignedChild = makeTask({
        id: "child-1",
        agentId: "unassigned",
        parentId: "epic-1",
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([unassignedChild]);
      // The parent lookup for findEpicOwner.
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ id: "epic-1", agentId: "agent-manager" }),
      );

      await reconcile(ctx, "agent-worker");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-manager",
        "task:epic-1",
        expect.objectContaining({ type: "tasks_need_assignment" }),
      );
    });

    it("falls back to trigger agent when no epic owner found", async () => {
      const orphanTask = makeTask({
        id: "task-1",
        agentId: "unassigned",
        parentId: undefined,
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([orphanTask]);

      await reconcile(ctx, "agent-worker");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-worker",
        "main",
        expect.objectContaining({ type: "tasks_need_assignment" }),
      );
    });

    it("falls back when parent has agentId 'unassigned'", async () => {
      const child = makeTask({
        id: "child-1",
        agentId: "unassigned",
        parentId: "epic-1",
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([child]);
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ id: "epic-1", agentId: "unassigned" }),
      );

      await reconcile(ctx, "agent-trigger");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-trigger",
        "task:epic-1",
        expect.objectContaining({ type: "tasks_need_assignment" }),
      );
    });
  });
});
