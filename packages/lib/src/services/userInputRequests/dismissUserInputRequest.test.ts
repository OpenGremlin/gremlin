import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { dismissUserInputRequest } from "./dismissUserInputRequest.js";

vi.mock("../../gql/resolverTypes.js", () => ({
  UserInputRequestStatus: { Dismissed: "DISMISSED", Resolved: "RESOLVED" },
}));

vi.mock("./getUserInputRequest.js", () => ({
  getUserInputRequest: vi.fn(),
}));

import { getUserInputRequest } from "./getUserInputRequest.js";

const mockedGetUserInputRequest = vi.mocked(getUserInputRequest);

describe("dismissUserInputRequest", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("sets status to Dismissed and writes correct DDB item", async () => {
    const existing = {
      id: "req-1",
      title: "Test",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00Z",
      agentId: "agent-1",
    };

    mockedGetUserInputRequest.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");

    const result = await dismissUserInputRequest(ctx, "req-1");

    expect(result).toEqual({ ...existing, status: "DISMISSED" });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const putCommand = mockDocSend.mock.calls[0][0];
    expect(putCommand.input).toEqual({
      TableName: "test-table",
      Item: {
        ...existing,
        status: "DISMISSED",
        _et: "UserInputRequest",
        pk: "USER_INPUT_REQUEST",
        sk: "USER_INPUT_REQUEST#req-1",
        gsi1pk: "INPUT_REQUEST_STATUS#DISMISSED",
        gsi1sk: "2024-01-01T00:00:00Z",
      },
    });
  });

  it("throws when user input request not found", async () => {
    mockedGetUserInputRequest.mockResolvedValue(null);

    await expect(dismissUserInputRequest(ctx, "nonexistent")).rejects.toThrow(
      "UserInputRequest nonexistent not found",
    );
  });
});
