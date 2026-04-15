import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { resolveCommandApproval } from "./resolveCommandApproval.js";

vi.mock("./getCommandApproval.js", () => ({
  getCommandApproval: vi.fn(),
}));

vi.mock("./allowlistStore.js", () => ({
  createAllowlistStore: vi.fn(() => ({
    addEntry: vi.fn(),
  })),
}));

vi.mock("./shellParse.js", () => ({
  analyzeCommand: vi.fn(() => ({
    ok: true,
    segments: [{ executable: "echo" }],
  })),
}));

import { getCommandApproval } from "./getCommandApproval.js";

const mockedGetCommandApproval = vi.mocked(getCommandApproval);

describe("resolveCommandApproval", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("publishes pendingItemsUpdated to pubsub", async () => {
    const existing = {
      id: "appr-1",
      agentId: "agent-1",
      taskId: "task-1",
      command: "echo hi",
      reason: "test",
      status: "PENDING",
      decision: null,
      logEntryId: "log-1",
      createdAt: "2024-01-01T00:00:00Z",
      resolvedAt: null,
    };

    mockedGetCommandApproval.mockResolvedValue(existing as any);

    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");
    ctx.services.inbox.enqueueWork.mockResolvedValue(undefined as any);

    await resolveCommandApproval(ctx, "appr-1", "ALLOW_ONCE");

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "pendingItemsUpdated",
    );
  });

  it("throws when approval not found", async () => {
    mockedGetCommandApproval.mockResolvedValue(null);

    await expect(
      resolveCommandApproval(ctx, "nonexistent", "ALLOW_ONCE"),
    ).rejects.toThrow("CommandApproval nonexistent not found");
  });

  it("throws when approval already resolved", async () => {
    mockedGetCommandApproval.mockResolvedValue({
      id: "appr-1",
      status: "RESOLVED",
    } as any);

    await expect(
      resolveCommandApproval(ctx, "appr-1", "ALLOW_ONCE"),
    ).rejects.toThrow("CommandApproval appr-1 is already resolved");
  });
});
