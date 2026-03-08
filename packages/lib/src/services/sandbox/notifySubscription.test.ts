import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { fanOut, subscribe } from "./notifySubscription.js";

describe("notifySubscription", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    mockSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("gremlin");
  });

  describe("subscribe", () => {
    it("writes a NotifyHookSubscription item to DynamoDB", async () => {
      await subscribe(ctx, "agent-1", "task-42", "sandbox_available");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const putCmd = mockSend.mock.calls[0][0];
      expect(putCmd.input.TableName).toBe("gremlin");
      expect(putCmd.input.Item).toMatchObject({
        _et: "NotifyHookSubscription",
        pk: "NOTIFY_SUB#agent-1",
        sk: "sandbox_available#task-42",
        agentId: "agent-1",
        taskId: "task-42",
        eventType: "sandbox_available",
      });
      expect(putCmd.input.Item.createdAt).toBeDefined();
    });
  });

  describe("fanOut", () => {
    it("returns 0 when there are no subscribers", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const count = await fanOut(ctx, "agent-1", "sandbox_available", {
        instanceId: "i-123",
      });

      expect(count).toBe(0);
      expect(mockSend).toHaveBeenCalledTimes(1); // only the query
    });

    it("enqueues work for each subscriber and deletes subscriptions", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            pk: "NOTIFY_SUB#agent-1",
            sk: "sandbox_available#task-1",
            taskId: "task-1",
          },
          {
            pk: "NOTIFY_SUB#agent-1",
            sk: "sandbox_available#task-2",
            taskId: "task-2",
          },
        ],
      });

      ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);
      // BatchWriteCommand response
      mockSend.mockResolvedValueOnce({});

      const count = await fanOut(ctx, "agent-1", "sandbox_available", {
        instanceId: "i-123",
      });

      expect(count).toBe(2);

      // Should enqueue for both tasks
      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledTimes(2);
      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-1",
        {
          type: "sandbox_available",
          payload: { instanceId: "i-123", taskId: "task-1" },
        },
      );
      expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
        ctx,
        "agent-1",
        {
          type: "sandbox_available",
          payload: { instanceId: "i-123", taskId: "task-2" },
        },
      );

      // Should delete subscriptions (query + batch delete = 2 DDB calls)
      expect(mockSend).toHaveBeenCalledTimes(2);
      const batchCmd = mockSend.mock.calls[1][0];
      expect(batchCmd.input.RequestItems.gremlin).toHaveLength(2);
      expect(batchCmd.input.RequestItems.gremlin[0].DeleteRequest.Key).toEqual({
        pk: "NOTIFY_SUB#agent-1",
        sk: "sandbox_available#task-1",
      });
    });

    it("batches deletes in groups of 25", async () => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        pk: "NOTIFY_SUB#agent-1",
        sk: `sandbox_available#task-${i}`,
        taskId: `task-${i}`,
      }));
      mockSend.mockResolvedValueOnce({ Items: items });
      ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);
      // Two batch deletes
      mockSend.mockResolvedValueOnce({});
      mockSend.mockResolvedValueOnce({});

      const count = await fanOut(ctx, "agent-1", "sandbox_available", {});

      expect(count).toBe(30);
      // query + 2 batch deletes
      expect(mockSend).toHaveBeenCalledTimes(3);
      const batch1 = mockSend.mock.calls[1][0];
      const batch2 = mockSend.mock.calls[2][0];
      expect(batch1.input.RequestItems.gremlin).toHaveLength(25);
      expect(batch2.input.RequestItems.gremlin).toHaveLength(5);
    });
  });
});
