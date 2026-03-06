import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { dismissNotification } from "./dismissNotification.js";

vi.mock("../../gql/resolverTypes.js", () => ({
  NotificationStatus: { Dismissed: "DISMISSED", Resolved: "RESOLVED" },
}));

vi.mock("./getNotification.js", () => ({
  getNotification: vi.fn(),
}));

import { getNotification } from "./getNotification.js";

const mockedGetNotification = vi.mocked(getNotification);

describe("dismissNotification", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("sets status to Dismissed and writes correct DDB item", async () => {
    const existing = {
      id: "notif-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
    };

    mockedGetNotification.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({ send: mockDocSend } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");

    const result = await dismissNotification(ctx, "notif-1");

    expect(result).toEqual({ ...existing, status: "DISMISSED" });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const putCommand = mockDocSend.mock.calls[0][0];
    expect(putCommand.input).toEqual({
      TableName: "test-table",
      Item: {
        ...existing,
        status: "DISMISSED",
        _et: "Notification",
        pk: "NOTIFICATION",
        sk: "NOTIFICATION#notif-1",
        gsi1pk: "NOTIF_STATUS#DISMISSED",
        gsi1sk: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("throws when notification not found", async () => {
    mockedGetNotification.mockResolvedValue(null);

    await expect(dismissNotification(ctx, "nonexistent")).rejects.toThrow(
      "Notification nonexistent not found",
    );
  });
});
