import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { markRead } from "./markRead.js";

function makeItem(overrides: Partial<InboxItemItem> = {}): InboxItemItem {
  return {
    id: "item-1",
    agentId: "agent-1",
    lane: "main",
    type: "message",
    payload: "{}",
    isRead: false,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("markRead", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
  });

  it("sends update for each item", async () => {
    const items = [
      makeItem({
        id: "item-1",
        agentId: "agent-1",
        createdAt: "2026-01-01T00:00:00Z",
      }),
      makeItem({
        id: "item-2",
        agentId: "agent-1",
        createdAt: "2026-01-02T00:00:00Z",
      }),
    ];

    await markRead(ctx, items);

    expect(mockDocSend).toHaveBeenCalledTimes(2);
  });

  it("handles empty array (no updates sent)", async () => {
    await markRead(ctx, []);

    expect(mockDocSend).not.toHaveBeenCalled();
  });

  it("sets isRead to true and TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-06T00:00:00Z"));

    const item = makeItem({
      id: "item-1",
      agentId: "agent-1",
      createdAt: "2026-01-01T00:00:00Z",
    });

    await markRead(ctx, [item]);

    const command = mockDocSend.mock.calls[0][0];
    const expectedTtl =
      Math.floor(new Date("2026-03-06T00:00:00Z").getTime() / 1000) +
      7 * 24 * 60 * 60;

    expect(command.input).toMatchObject({
      TableName: "test-table",
      Key: {
        pk: "AGENT_INBOX#agent-1#main",
        sk: "ITEM#2026-01-01T00:00:00Z#item-1",
      },
      ExpressionAttributeValues: {
        ":true": true,
        ":ttl": expectedTtl,
      },
    });

    vi.useRealTimers();
  });
});
