import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { CommandApprovalStatus } from "../../enums.js";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getPendingCommandApprovals } from "./getPendingCommandApprovals.js";

describe("getPendingCommandApprovals", () => {
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

  it("returns pending command approvals", async () => {
    const items = [
      {
        id: "ca-1",
        agentId: "agent-1",
        taskId: "task-1",
        command: "rm -rf /",
        reason: "Dangerous command",
        status: CommandApprovalStatus.Pending,
        createdAt: "2026-03-20T00:00:00Z",
      },
      {
        id: "ca-2",
        agentId: "agent-2",
        taskId: "task-2",
        command: "npm install",
        reason: "Package install",
        status: CommandApprovalStatus.Pending,
        createdAt: "2026-03-20T01:00:00Z",
      },
    ];
    mockDocSend.mockResolvedValue({ Items: items });

    const result = await getPendingCommandApprovals(ctx);

    expect(result).toEqual(items);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no pending approvals exist", async () => {
    mockDocSend.mockResolvedValue({ Items: [] });

    const result = await getPendingCommandApprovals(ctx);

    expect(result).toEqual([]);
  });

  it("returns empty array when Items is undefined", async () => {
    mockDocSend.mockResolvedValue({ Items: undefined });

    const result = await getPendingCommandApprovals(ctx);

    expect(result).toEqual([]);
  });

  it("queries with correct partition key", async () => {
    mockDocSend.mockResolvedValue({ Items: [] });

    await getPendingCommandApprovals(ctx);

    expect(mockDocSend).toHaveBeenCalledOnce();
    const command = mockDocSend.mock.calls[0][0];
    const input = command.input;
    expect(input.TableName).toBe("test-table");
    expect(input.KeyConditionExpression).toBe("pk = :pk");
    expect(input.FilterExpression).toBeUndefined();
    expect(input.ExpressionAttributeValues).toEqual({
      ":pk": "COMMAND_APPROVAL",
    });
  });
});
