import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { closeCompletedParents, reconcile } from "./reconcileTasks.js";

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

  // ── closeCompletedParents ─────────────────────────────────────────

  describe("closeCompletedParents", () => {
    it("notifies the epic owner, not the trigger agent", async () => {
      const epic = makeTask({
        id: "epic-1",
        agentId: "agent-manager",
        status: "in_progress",
        parentId: undefined,
      });

      ctx.services.tasks.listTasks.mockResolvedValue([epic]);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed", parentId: "epic-1" }),
        makeTask({ id: "child-2", status: "closed", parentId: "epic-1" }),
      ]);

      await closeCompletedParents(ctx, "agent-worker");

      // Should close the epic.
      expect(ctx.services.tasks.closeTask).toHaveBeenCalledWith(
        ctx,
        "epic-1",
        "All children completed",
      );

      // Notification goes to the epic's own agent, NOT the trigger agent.
      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-manager",
        "main",
        expect.objectContaining({ type: "top_level_task_complete" }),
      );
    });

    it("falls back to triggerAgentId when epic has no agentId", async () => {
      const epic = makeTask({
        id: "epic-1",
        agentId: undefined,
        status: "in_progress",
        parentId: undefined,
      });

      ctx.services.tasks.listTasks.mockResolvedValue([epic]);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed", parentId: "epic-1" }),
      ]);

      await closeCompletedParents(ctx, "agent-worker");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-worker",
        "main",
        expect.objectContaining({ type: "top_level_task_complete" }),
      );
    });

    it("falls back to triggerAgentId when epic agentId is 'unassigned'", async () => {
      const epic = makeTask({
        id: "epic-1",
        agentId: "unassigned",
        status: "in_progress",
        parentId: undefined,
      });

      ctx.services.tasks.listTasks.mockResolvedValue([epic]);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed", parentId: "epic-1" }),
      ]);

      await closeCompletedParents(ctx, "agent-worker");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-worker",
        "main",
        expect.objectContaining({ type: "top_level_task_complete" }),
      );
    });

    it("does not notify when a non-top-level parent closes", async () => {
      const midLevel = makeTask({
        id: "mid-1",
        agentId: "agent-manager",
        status: "in_progress",
        parentId: "epic-1", // has a parent → not top-level
      });

      ctx.services.tasks.listTasks.mockResolvedValue([midLevel]);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed", parentId: "mid-1" }),
      ]);

      await closeCompletedParents(ctx, "agent-worker");

      expect(ctx.services.tasks.closeTask).toHaveBeenCalled();
      expect(ctx.services.inbox.enqueueWork).not.toHaveBeenCalled();
    });

    it("skips parents whose children are not all closed", async () => {
      const epic = makeTask({
        id: "epic-1",
        agentId: "agent-manager",
        status: "in_progress",
      });

      ctx.services.tasks.listTasks.mockResolvedValue([epic]);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed", parentId: "epic-1" }),
        makeTask({
          id: "child-2",
          status: "in_progress",
          parentId: "epic-1",
        }),
      ]);

      await closeCompletedParents(ctx, "agent-worker");

      expect(ctx.services.tasks.closeTask).not.toHaveBeenCalled();
      expect(ctx.services.inbox.enqueueWork).not.toHaveBeenCalled();
    });
  });

  // ── tasks_need_assignment ─────────────────────────────────────────

  describe("tasks_need_assignment routing", () => {
    it("routes to epic owner when unassigned tasks have a parent", async () => {
      const unassignedChild = makeTask({
        id: "child-1",
        agentId: "unassigned",
        parentId: "epic-1",
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([unassignedChild]);
      ctx.services.tasks.getChildren.mockResolvedValue([]);
      // The parent lookup for findEpicOwner.
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ id: "epic-1", agentId: "agent-manager" }),
      );

      await reconcile(ctx, "agent-worker");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-manager",
        "main",
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
      ctx.services.tasks.getChildren.mockResolvedValue([]);

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
      ctx.services.tasks.getChildren.mockResolvedValue([]);
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ id: "epic-1", agentId: "unassigned" }),
      );

      await reconcile(ctx, "agent-trigger");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-trigger",
        "main",
        expect.objectContaining({ type: "tasks_need_assignment" }),
      );
    });
  });

  // ── Standalone task completion ────────────────────────────────────

  describe("standalone task completion", () => {
    it("notifies the trigger agent for standalone tasks", async () => {
      const task = makeTask({
        id: "task-1",
        agentId: "agent-worker",
        status: "closed",
        parentId: undefined,
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([]);
      ctx.services.tasks.getTask.mockResolvedValue(task);
      ctx.services.tasks.getChildren.mockResolvedValue([]);

      await reconcile(ctx, "agent-worker", "task-1");

      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-worker",
        "main",
        expect.objectContaining({ type: "top_level_task_complete" }),
      );
    });

    it("does not notify for child tasks", async () => {
      const task = makeTask({
        id: "task-1",
        status: "closed",
        parentId: "epic-1",
      });

      ctx.services.tasks.getReadyWork.mockResolvedValue([]);
      ctx.services.tasks.getTask.mockResolvedValue(task);

      await reconcile(ctx, "agent-worker", "task-1");

      expect(ctx.services.inbox.enqueueWork).not.toHaveBeenCalled();
    });
  });
});
