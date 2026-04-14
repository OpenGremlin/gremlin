import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import {
  closeTask,
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
  issueType: "task",
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
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
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

      const result = await updateTaskStatus(ctx, "task-1", "closed");

      expect(result.status).toBe("closed");
      expect(result.closedAt).toBe(NOW);
    });

    it("rejects invalid status values", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      await expect(
        updateTaskStatus(ctx, "task-1", "done"),
      ).rejects.toThrow('Invalid status "done"');
    });

    it("throws when task not found", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(null);

      await expect(
        updateTaskStatus(ctx, "nonexistent", "open"),
      ).rejects.toThrow("Task nonexistent not found");
    });

    it("publishes to task and parent channels with correct data", async () => {
      const parentTask = makeTask({ id: "epic-1", issueType: "epic" });
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
        expect.objectContaining({ id: "epic-1", issueType: "epic" }),
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

      const result = await closeTask(ctx, "task-1");

      expect(result.status).toBe("closed");
      expect(result.closedAt).toBe(NOW);
    });

    it("sets closeReason when provided", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await closeTask(ctx, "task-1", "completed");

      expect(result.closeReason).toBe("completed");
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).toContain("closeReason");
    });

    it("omits closeReason from DDB when not provided", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      await closeTask(ctx, "task-1");

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.UpdateExpression).not.toContain("closeReason");
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
      expect(cmd.input.UpdateExpression).toContain("REMOVE closedAt, closeReason");
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

    it("updates assignee and GSI1 key", async () => {
      ctx.services.tasks.getTask.mockResolvedValue(makeTask() as any);

      const result = await updateTaskFields(ctx, "task-1", {
        assignee: "agent-2",
      });

      expect(result.agentId).toBe("agent-2");
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ExpressionAttributeValues[":gsi1pk"]).toBe(
        "TASK_AGENT#agent-2",
      );
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
      expect(cmd.input.UpdateExpression).not.toContain("agentId");
      expect(cmd.input.UpdateExpression).not.toContain("deferUntil");
    });
  });
});
