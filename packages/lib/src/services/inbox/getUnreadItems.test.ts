import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getUnreadItems } from "./getUnreadItems.js";

describe("getUnreadItems", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    mockDocSend = vi.fn();
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
  });

  it("returns items for an agent", async () => {
    const items = [
      {
        id: "item-1",
        agentId: "agent-1",
        isRead: false,
        type: "message",
        payload: "{}",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "item-2",
        agentId: "agent-1",
        isRead: false,
        type: "message",
        payload: "{}",
        createdAt: "2026-01-02T00:00:00Z",
      },
    ];
    mockDocSend.mockResolvedValue({ Items: items });

    const result = await getUnreadItems(ctx, "agent-1");

    expect(result).toEqual(items);
  });

  it("returns empty array when no items", async () => {
    mockDocSend.mockResolvedValue({ Items: undefined });

    const result = await getUnreadItems(ctx, "agent-1");

    expect(result).toEqual([]);
  });

  it("passes correct agentId in query", async () => {
    mockDocSend.mockResolvedValue({ Items: [] });

    await getUnreadItems(ctx, "agent-42");

    expect(mockDocSend).toHaveBeenCalledOnce();
    const command = mockDocSend.mock.calls[0][0];
    expect(command.input).toMatchObject({
      TableName: "test-table",
      ExpressionAttributeValues: expect.objectContaining({
        ":pk": "AGENT_INBOX#agent-42",
        ":prefix": "ITEM#",
        ":false": false,
      }),
    });
  });
});
