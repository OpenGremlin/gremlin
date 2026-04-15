import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { addComment, getComments, getLatestComment } from "./taskComments.js";

const NOW = "2026-01-15T12:00:00.000Z";

describe("taskComments", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("comment-uuid"),
    });

    mockDocSend = vi.fn().mockResolvedValue({ Items: [] });
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");
  });

  // ── addComment ────────────────────────────────────────────────

  describe("addComment", () => {
    it("returns comment with generated id and timestamp", async () => {
      const result = await addComment(ctx, {
        taskId: "task-1",
        author: "agent-1",
        text: "progress update",
      });

      expect(result).toEqual({
        id: "comment-uuid",
        taskId: "task-1",
        author: "agent-1",
        text: "progress update",
        createdAt: NOW,
      });
    });

    it("writes to DDB with correct pk/sk", async () => {
      await addComment(ctx, {
        taskId: "task-1",
        author: "agent-1",
        text: "hello",
      });

      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.Item).toEqual(
        expect.objectContaining({
          pk: "TASK_COMMENT#task-1",
          sk: `COMMENT#${NOW}#comment-uuid`,
          _et: "TaskComment",
          taskId: "task-1",
          text: "hello",
        }),
      );
    });
  });

  // ── getComments ───────────────────────────────────────────────

  describe("getComments", () => {
    it("queries with correct pk and ascending order", async () => {
      mockDocSend.mockResolvedValueOnce({
        Items: [
          { id: "c1", taskId: "task-1", text: "first", createdAt: "2026-01-01" },
          { id: "c2", taskId: "task-1", text: "second", createdAt: "2026-01-02" },
        ],
      });

      const result = await getComments(ctx, "task-1");

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("first");
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ExpressionAttributeValues[":pk"]).toBe(
        "TASK_COMMENT#task-1",
      );
      expect(cmd.input.ScanIndexForward).toBe(true);
    });

    it("returns empty array when no comments", async () => {
      mockDocSend.mockResolvedValueOnce({ Items: [] });

      const result = await getComments(ctx, "task-1");

      expect(result).toEqual([]);
    });
  });

  // ── getLatestComment ──────────────────────────────────────────

  describe("getLatestComment", () => {
    it("returns most recent comment", async () => {
      mockDocSend.mockResolvedValueOnce({
        Items: [{ id: "c2", text: "latest", createdAt: "2026-01-10" }],
      });

      const result = await getLatestComment(ctx, "task-1");

      expect(result?.text).toBe("latest");
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ScanIndexForward).toBe(false);
      expect(cmd.input.Limit).toBe(1);
    });

    it("returns undefined when no comments exist", async () => {
      mockDocSend.mockResolvedValueOnce({ Items: [] });

      const result = await getLatestComment(ctx, "task-1");

      expect(result).toBeUndefined();
    });
  });
});
