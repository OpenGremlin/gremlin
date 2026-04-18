import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import {
  closeTask,
  incrementEscalationCount,
  reopenTask,
  updateTaskFields,
  updateTaskStatus,
} from "./taskLifecycle.js";

const NOW = "2026-01-15T12:00:00.000Z";

const makeTask = (overrides = {}) => ({
  id: "task-1",
  agentId: "agent-1",
  title: "Test Task",
  message: null,
  status: "open",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  originJobId: null,
  ...overrides,
});

describe("taskLifecycle", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));

    mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");
  });

  // ── updateTaskStatus ──────────────────────────────────────────

  describe("updateTaskStatus", () => {
    it("updates status and GSI4 keys", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await updateTaskStatus(ctx, "task-1", "in_progress");

      expect(result.status).toBe("in_progress");
      expect(result.updatedAt).toBe(NOW);
      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ExpressionAttributeValues[":gsi4pk"]).toBe(
        "TASK_STATUS#in_progress",
      );
    });

    it("sets closedAt when closing", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([] as any);

      const result = await updateTaskStatus(ctx, "task-1", "closed");

      expect(result.status).toBe("closed");
      expect(result.closedAt).toBe(NOW);
    });

    it("rejects invalid status values", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      await expect(updateTaskStatus(ctx, "task-1", "bogus")).rejects.toThrow(
        'Invalid status "bogus"',
      );
    });

    it("throws when task not found", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(null);

      await expect(
        updateTaskStatus(ctx, "nonexistent", "open"),
      ).rejects.toThrow("Task nonexistent not found");
    });

    it("publishes to task and parent channels with correct data", async () => {
      const parentTask = makeTask({ id: "epic-1" });
      ctx.services.tasks.getTask
        .mockResolvedValueOnce(makeTask({ parentId: "epic-1" }) as any) // initial load
        .mockResolvedValueOnce(parentTask as any); // notifyParent re-fetch

      await updateTaskStatus(ctx, "task-1", "in_progress");

      expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
        "taskUpdated:task-1",
        expect.objectContaining({ id: "task-1", status: "in_progress" }),
      );
      // Parent receives its own data, not the child's
      expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
        "taskUpdated:epic-1",
        expect.objectContaining({ id: "epic-1" }),
      );
    });

    it("does not publish to parent when no parentId", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      await updateTaskStatus(ctx, "task-1", "open");

      expect(ctx.resources.pubsub.publish).toHaveBeenCalledTimes(1);
      expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
        "taskUpdated:task-1",
        expect.anything(),
      );
    });
  });

  // ── closeTask ─────────────────────────────────────────────────

  describe("closeTask", () => {
    it("sets status to closed with closedAt", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([] as any);

      const result = await closeTask(ctx, "task-1");

      expect(result.status).toBe("closed");
      expect(result.closedAt).toBe(NOW);
    });

    it("sets closeReason when provided", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([] as any);

      const result = await closeTask(ctx, "task-1", "completed");

      expect(result.closeReason).toBe("completed");
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).toContain("closeReason");
    });

    it("omits closeReason from DDB when not provided", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([] as any);

      await closeTask(ctx, "task-1");

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).not.toContain("closeReason");
    });

    it("rejects closing a task with open children", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "open" }),
        makeTask({ id: "child-2", status: "closed" }),
      ] as any);

      await expect(closeTask(ctx, "task-1")).rejects.toThrow("Cannot close");
      await expect(closeTask(ctx, "task-1")).rejects.toThrow("child-1");
    });

    it("allows closing a task when all children are closed", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([
        makeTask({ id: "child-1", status: "closed" }),
        makeTask({ id: "child-2", status: "closed" }),
      ] as any);

      const result = await closeTask(ctx, "task-1");

      expect(result.status).toBe("closed");
    });

    it("allows closing a task with no children", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);
      ctx.services.tasks.getChildren.mockResolvedValue([] as any);

      const result = await closeTask(ctx, "task-1");

      expect(result.status).toBe("closed");
    });

    it("is a no-op when the task is already closed", async () => {
      const alreadyClosed = makeTask({
        status: "closed",
        parentId: "epic-1",
        closedAt: "2026-01-10T00:00:00.000Z",
        closeReason: "done earlier",
      });
      ctx.services.tasks.getTask.mockResolvedValue(alreadyClosed as any);

      const result = await closeTask(ctx, "task-1", "redundant reason");

      // Returns the existing task untouched; closeReason is NOT overwritten.
      expect(result).toBe(alreadyClosed);
      expect(result.closeReason).toBe("done earlier");
      // No DDB write, no pubsub (including no parent notification despite
      // parentId being set), no children lookup.
      expect(mockDocSend).not.toHaveBeenCalled();
      expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
      expect(ctx.services.tasks.getChildren).not.toHaveBeenCalled();
    });
  });

  // ── reopenTask ────────────────────────────────────────────────

  describe("reopenTask", () => {
    it("sets status back to open and removes closedAt/closeReason", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({
          status: "closed",
          closedAt: "2026-01-10T00:00:00.000Z",
          closeReason: "done",
        }) as any,
      );

      const result = await reopenTask(ctx, "task-1");

      expect(result.status).toBe("open");
      expect(result).not.toHaveProperty("closedAt");
      expect(result).not.toHaveProperty("closeReason");
    });

    it("uses REMOVE expression for closedAt and closeReason", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ status: "closed", closedAt: NOW }) as any,
      );

      await reopenTask(ctx, "task-1");

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).toContain(
        "REMOVE closedAt, closeReason",
      );
    });
  });

  // ── updateTaskFields ──────────────────────────────────────────

  describe("updateTaskFields", () => {
    it("updates priority", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await updateTaskFields(ctx, "task-1", { priority: 0 });

      expect(result.priority).toBe(0);
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ExpressionAttributeValues[":priority"]).toBe(0);
    });

    it("updates deferUntil", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await updateTaskFields(ctx, "task-1", {
        deferUntil: "2026-02-01T00:00:00.000Z",
      });

      expect(result.deferUntil).toBe("2026-02-01T00:00:00.000Z");
    });

    it("updates description", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await updateTaskFields(ctx, "task-1", {
        description: "New desc",
      });

      expect(result.description).toBe("New desc");
    });

    it("only writes provided fields", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      await updateTaskFields(ctx, "task-1", { priority: 1 });

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).toContain("priority");
      expect(cmd.input.UpdateExpression).not.toContain("deferUntil");
    });

    it("does not accept assignee changes (immutable assignment)", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      // updateTaskFields no longer has an assignee param — verify the
      // function signature doesn't allow it at the type level. We can
      // at least confirm agentId is never in the update expression.
      await updateTaskFields(ctx, "task-1", { priority: 2 });

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).not.toContain("agentId");
    });
  });

  // ── escalation ───────────────────────────────────────────────

  describe("escalation", () => {
    it("increments escalationCount on rejection (closed → open)", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ status: "closed", escalationCount: 1 }) as any,
      );

      const result = await updateTaskStatus(
        ctx,
        "task-1",
        "open",
        "please fix the failing test",
      );

      expect(result.escalationCount).toBe(2);
      // Should have called incrementEscalationCount (second DDB send)
      expect(mockDocSend).toHaveBeenCalledTimes(2);
    });

    it("rejects closed → open without a reason", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ status: "closed" }) as any,
      );

      await expect(updateTaskStatus(ctx, "task-1", "open")).rejects.toThrow(
        /without a reason/,
      );
      // No DDB write should have happened before the validation failure.
      expect(mockDocSend).not.toHaveBeenCalled();
    });

    it("rejects closed → open with a whitespace-only reason", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ status: "closed" }) as any,
      );

      await expect(
        updateTaskStatus(ctx, "task-1", "open", "   "),
      ).rejects.toThrow(/without a reason/);
    });

    it("does not increment escalationCount for non-rejection transitions", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask({ status: "open" }) as any,
      );

      const result = await updateTaskStatus(ctx, "task-1", "in_progress");

      expect(result.escalationCount).toBeUndefined();
      expect(mockDocSend).toHaveBeenCalledTimes(1);
    });

    it("incrementEscalationCount writes atomic increment", async () => {
      await incrementEscalationCount(ctx, "task-1");

      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).toContain(
        "escalationCount = if_not_exists(escalationCount, :zero) + :one",
      );
    });
  });
});
