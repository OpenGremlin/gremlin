import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { resolveUserInputRequest } from "./resolveUserInputRequest.js";

vi.mock("../../gql/resolverTypes.js", () => ({
  UserInputRequestStatus: { Dismissed: "DISMISSED", Resolved: "RESOLVED" },
}));

vi.mock("./getUserInputRequest.js", () => ({
  getUserInputRequest: vi.fn(),
}));

import { getUserInputRequest } from "./getUserInputRequest.js";

const mockedGetUserInputRequest = vi.mocked(getUserInputRequest);

describe("resolveUserInputRequest", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("sets status to Resolved with resolvedAction and writes correct DDB item", async () => {
    const existing = {
      id: "req-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
      lane: "main",
    };

    mockedGetUserInputRequest.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    const result = await resolveUserInputRequest(ctx, "req-1", "Approve");

    expect(result).toEqual({
      ...existing,
      status: "RESOLVED",
      resolvedAction: "Approve",
    });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const putCommand = mockDocSend.mock.calls[0][0];
    expect(putCommand.input).toEqual({
      TableName: "test-table",
      Item: {
        ...existing,
        status: "RESOLVED",
        resolvedAction: "Approve",
        _et: "UserInputRequest",
        pk: "USER_INPUT_REQUEST",
        sk: "USER_INPUT_REQUEST#req-1",
        gsi1pk: "INPUT_REQUEST_STATUS#RESOLVED",
        gsi1sk: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("enqueues inbox work to the request's originating lane", async () => {
    const existing = {
      id: "req-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
      lane: "task:task-42",
    };

    mockedGetUserInputRequest.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    await resolveUserInputRequest(ctx, "req-1", "Approve");

    expect(ctx.services.inbox.enqueueWork).toHaveBeenCalledWith(
      ctx,
      "agent-1",
      "task:task-42",
      {
        type: "user_input_request_reply",
        payload: { requestId: "req-1", action: "Approve" },
      },
    );
  });

  it("publishes pendingItemsUpdated to pubsub", async () => {
    const existing = {
      id: "req-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
      lane: "main",
    };

    mockedGetUserInputRequest.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    await resolveUserInputRequest(ctx, "req-1", "Approve");

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "pendingItemsUpdated",
    );
  });

  it("throws when user input request not found", async () => {
    mockedGetUserInputRequest.mockResolvedValue(null);

    await expect(
      resolveUserInputRequest(ctx, "nonexistent", "action-1"),
    ).rejects.toThrow("UserInputRequest nonexistent not found");
  });
});
