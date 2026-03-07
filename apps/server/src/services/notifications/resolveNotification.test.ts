import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { resolveNotification } from "./resolveNotification.js";

vi.mock("../../gql/resolverTypes.js", () => ({
  NotificationStatus: { Dismissed: "DISMISSED", Resolved: "RESOLVED" },
}));

vi.mock("./getNotification.js", () => ({
  getNotification: vi.fn(),
}));

import { getNotification } from "./getNotification.js";

const mockedGetNotification = vi.mocked(getNotification);

describe("resolveNotification", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("sets status to Resolved with resolvedAction and writes correct DDB item", async () => {
    const existing = {
      id: "notif-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
    };

    mockedGetNotification.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    const result = await resolveNotification(ctx, "notif-1", "action-approve");

    expect(result).toEqual({
      ...existing,
      status: "RESOLVED",
      resolvedAction: "action-approve",
    });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const putCommand = mockDocSend.mock.calls[0][0];
    expect(putCommand.input).toEqual({
      TableName: "test-table",
      Item: {
        ...existing,
        status: "RESOLVED",
        resolvedAction: "action-approve",
        _et: "Notification",
        pk: "NOTIFICATION",
        sk: "NOTIFICATION#notif-1",
        gsi1pk: "NOTIF_STATUS#RESOLVED",
        gsi1sk: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("enqueues inbox work with notification reply", async () => {
    const existing = {
      id: "notif-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
    };

    mockedGetNotification.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    await resolveNotification(ctx, "notif-1", "action-approve");

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "agent-1",
      {
        type: "user_notification_reply",
        payload: { notificationId: "notif-1", actionId: "action-approve" },
      },
    );
  });

  it("throws when notification not found", async () => {
    mockedGetNotification.mockResolvedValue(null);

    await expect(
      resolveNotification(ctx, "nonexistent", "action-1"),
    ).rejects.toThrow("Notification nonexistent not found");
  });
});
