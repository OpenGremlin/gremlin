import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { requestUserInputTool } from "./requestUserInput.js";

describe("requestUserInputTool", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("returns inputRequestId and pending status", async () => {
    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");

    const tool = requestUserInputTool(ctx, "agent-1", "main");
    const result = await tool.execute(
      {
        message: "Should I proceed?",
        actions: [
          { label: "Yes", style: "primary" },
          { label: "No", style: "secondary" },
        ],
      },
      {
        toolCallId: "tc-1",
        messages: [],
        abortSignal: new AbortController().signal,
      },
    );

    expect(result).toMatchObject({
      ok: true,
      status: "pending",
    });
    expect(result.inputRequestId).toBeDefined();
    expect(typeof result.inputRequestId).toBe("string");
  });

  it("publishes pendingItemsUpdated to pubsub", async () => {
    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");

    const tool = requestUserInputTool(ctx, "agent-1", "main");
    await tool.execute(
      {
        message: "Should I proceed?",
        actions: [
          { label: "Yes", style: "primary" },
          { label: "No", style: "secondary" },
        ],
      },
      {
        toolCallId: "tc-1",
        messages: [],
        abortSignal: new AbortController().signal,
      },
    );

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "pendingItemsUpdated",
    );
  });

  it("writes a PENDING UserInputRequest to DynamoDB", async () => {
    const mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");

    const tool = requestUserInputTool(ctx, "agent-1", "task:task-1");
    await tool.execute(
      {
        message: "Deploy?",
        actions: [
          { label: "Deploy", style: "primary" },
          { label: "Cancel", style: "secondary" },
        ],
      },
      {
        toolCallId: "tc-1",
        messages: [],
        abortSignal: new AbortController().signal,
      },
    );

    expect(mockDocSend).toHaveBeenCalledOnce();
    const putCommand = mockDocSend.mock.calls[0][0];
    const item = putCommand.input.Item;
    expect(item._et).toBe("UserInputRequest");
    expect(item.agentId).toBe("agent-1");
    expect(item.lane).toBe("task:task-1");
    expect(item.message).toBe("Deploy?");
    expect(item.actions).toEqual([
      { label: "Deploy", style: "primary" },
      { label: "Cancel", style: "secondary" },
    ]);
    expect(item.status).toBe("PENDING");
  });
});
