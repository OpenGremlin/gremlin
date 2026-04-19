import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { updateAgentLogResult, writeAgentLog } from "./writeAgentLog.js";

/**
 * These tests lock in the `toolError` persistence contract. Tool errors flow
 * from execution → DDB column → GraphQL field → client renderer. The column
 * is the one piece this module owns: if `toolError` is not extracted into its
 * own column here, the client loses the typed error payload and renders an
 * empty card (the ToolBlock has a `null` result after envelope unwrap).
 *
 * Regressions are invisible in the UI (the agent still works from the
 * stringified envelope). These tests are the canary.
 */
describe("writeAgentLog tool-error persistence", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let send: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    send = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("chat-table");
    // Stub the DynamoDB Toolbox chain used for the best-effort "bump Agent's
    // lastLogAt" write. We don't care about its payload in these tests — just
    // that it doesn't explode.
    const chain = {
      item: () => chain,
      options: () => chain,
      send: vi.fn().mockResolvedValue({}),
    };
    (ctx.resources.ddb.entities.Agent as any).build = vi.fn(() => chain);
  });

  function getPutItem(): Record<string, unknown> {
    const calls = send.mock.calls.filter(
      (c) => c[0] instanceof PutCommand,
    ) as any[];
    expect(calls.length).toBeGreaterThan(0);
    return calls[0][0].input.Item as Record<string, unknown>;
  }

  it("extracts and writes the toolError column when a tool returns {ok:false,error}", async () => {
    await writeAgentLog(ctx, {
      agentId: "agent-1",
      taskId: null,
      role: "TOOL",
      toolName: "readFile" as any,
      toolInput: { path: "/workspace/missing.md" },
      toolResult: {
        ok: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "No file at /workspace/missing.md",
          hint: "Use listFiles to discover valid paths.",
        },
      },
    });

    const item = getPutItem();
    expect(item.toolError).toEqual({
      code: "FILE_NOT_FOUND",
      message: "No file at /workspace/missing.md",
      hint: "Use listFiles to discover valid paths.",
    });
    // toolResult column still holds the full envelope — the GraphQL
    // resolver unwraps it at the wire boundary. Don't pre-strip here.
    expect(JSON.parse(item.toolResult as string)).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "FILE_NOT_FOUND" }),
    });
  });

  it("omits the toolError column on successful results", async () => {
    await writeAgentLog(ctx, {
      agentId: "agent-1",
      taskId: null,
      role: "TOOL",
      toolName: "readFile" as any,
      toolInput: { path: "/workspace/ok.md" },
      toolResult: { ok: true, data: { content: "hi" } },
    });

    const item = getPutItem();
    expect(item.toolError).toBeUndefined();
  });

  it("omits toolError for malformed shapes rather than storing garbage", async () => {
    // Missing `error` object entirely — can't form a GremlinToolError.
    await writeAgentLog(ctx, {
      agentId: "agent-1",
      taskId: null,
      role: "TOOL",
      toolName: "readFile" as any,
      toolInput: {},
      toolResult: { ok: false },
    });

    expect(getPutItem().toolError).toBeUndefined();
  });
});

describe("updateAgentLogResult tool-error REMOVE-on-success", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let send: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    send = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("chat-table");
  });

  function getUpdateInput(): any {
    const calls = send.mock.calls.filter(
      (c) => c[0] instanceof UpdateCommand,
    ) as any[];
    expect(calls.length).toBeGreaterThan(0);
    return calls[0][0].input;
  }

  it("SETs toolError when the updated result is an error", async () => {
    await updateAgentLogResult(ctx, "log-1", "2026-04-19T00:00:00Z", {
      agentId: "agent-1",
      taskId: null,
      toolName: "readFile" as any,
      toolInput: { path: "/workspace/x" },
      toolResult: {
        ok: false,
        error: { code: "FILE_NOT_FOUND", message: "no" },
      },
    });

    const input = getUpdateInput();
    expect(input.UpdateExpression).toContain("toolError = :terr");
    expect(input.UpdateExpression).not.toContain("REMOVE toolError");
    expect(input.ExpressionAttributeValues[":terr"]).toEqual({
      code: "FILE_NOT_FOUND",
      message: "no",
    });
  });

  it("REMOVEs toolError on retry-success so a stale error from an earlier attempt is cleared", async () => {
    // Simulates: first call wrote toolError. Now a retry succeeded — we must
    // drop the stale error so the UI stops rendering the red error card.
    await updateAgentLogResult(ctx, "log-1", "2026-04-19T00:00:00Z", {
      agentId: "agent-1",
      taskId: null,
      toolName: "readFile" as any,
      toolInput: { path: "/workspace/x" },
      toolResult: { ok: true, data: { content: "now it works" } },
    });

    const input = getUpdateInput();
    expect(input.UpdateExpression).toContain("REMOVE toolError");
    expect(input.ExpressionAttributeValues[":terr"]).toBeUndefined();
  });
});
