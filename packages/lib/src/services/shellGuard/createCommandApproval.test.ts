import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { createCommandApproval } from "./createCommandApproval.js";

describe("createCommandApproval", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("writes a PENDING approval to DynamoDB", async () => {
    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");

    const result = await createCommandApproval(ctx, {
      agentId: "agent-1",
      taskId: "task-1",
      command: "rm -rf /",
      reason: "dangerous",
    });

    expect(result.agentId).toBe("agent-1");
    expect(result.taskId).toBe("task-1");
    expect(result.command).toBe("rm -rf /");
    expect(result.reason).toBe("dangerous");
    expect(result.status).toBe("PENDING");
    expect(result.decision).toBeNull();
    expect(result.id).toBeDefined();

    expect(mockDocSend).toHaveBeenCalledOnce();
  });

  it("publishes pendingItemsUpdated to pubsub", async () => {
    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");

    await createCommandApproval(ctx, {
      agentId: "agent-1",
      taskId: "task-1",
      command: "echo hi",
      reason: "test",
    });

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "pendingItemsUpdated",
    );
  });
});
