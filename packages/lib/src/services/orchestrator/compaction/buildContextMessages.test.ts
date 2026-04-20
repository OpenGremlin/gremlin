import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { buildContextMessages } from "./buildContextMessages.js";

function logEntry(overrides: Record<string, unknown>) {
  return {
    id: "id-default",
    role: "USER",
    content: "",
    ...overrides,
  };
}

describe("buildContextMessages tool grouping", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
  });

  function setLogs(entries: Array<Record<string, unknown>>) {
    ctx.services.agentLogs.getAgentLogs.mockResolvedValue({
      edges: entries.map((e) => ({ node: logEntry(e) })),
    });
    ctx.services.agentLogs.getTaskLogs.mockResolvedValue({
      edges: entries.map((e) => ({ node: logEntry(e) })),
    });
  }

  it("groups consecutive tool entries into one assistant + one tool message", async () => {
    setLogs([
      { id: "u1", role: "USER", content: "please do X" },
      {
        id: "t1",
        role: "TOOL",
        toolName: "readFile",
        toolInput: JSON.stringify({ path: "/a" }),
        toolResult: JSON.stringify({ ok: true, data: "a-contents" }),
      },
      {
        id: "t2",
        role: "TOOL",
        toolName: "readFile",
        toolInput: JSON.stringify({ path: "/b" }),
        toolResult: JSON.stringify({ ok: true, data: "b-contents" }),
      },
      { id: "a1", role: "AGENT", content: "done" },
    ]);

    const { messages } = await buildContextMessages(ctx, {
      agentId: "agent-1",
      taskId: null,
    });

    expect(messages).toHaveLength(4);
    expect(messages[0]).toEqual({ role: "user", content: "please do X" });
    expect(messages[1].role).toBe("assistant");
    expect(Array.isArray(messages[1].content)).toBe(true);
    expect((messages[1].content as unknown[]).length).toBe(2);
    expect(messages[2].role).toBe("tool");
    expect((messages[2].content as unknown[]).length).toBe(2);
    expect(messages[3]).toEqual({ role: "assistant", content: "done" });
  });

  it("uses the log entry id as toolCallId for deterministic caching", async () => {
    setLogs([
      {
        id: "known-id-42",
        role: "TOOL",
        toolName: "foo",
        toolInput: JSON.stringify({ a: 1 }),
        toolResult: JSON.stringify({ ok: true }),
      },
    ]);

    const { messages } = await buildContextMessages(ctx, {
      agentId: "a",
      taskId: null,
    });

    const toolCall = (messages[0].content as Array<{ toolCallId: string }>)[0];
    const toolResult = (
      messages[1].content as Array<{ toolCallId: string }>
    )[0];
    expect(toolCall.toolCallId).toBe("known-id-42");
    expect(toolResult.toolCallId).toBe("known-id-42");
  });

  it("produces byte-identical output on repeated calls (cache invariant)", async () => {
    const entries = [
      { id: "u1", role: "USER", content: "go" },
      {
        id: "t1",
        role: "TOOL",
        toolName: "readFile",
        toolInput: JSON.stringify({ path: "/x", offset: 0 }),
        toolResult: JSON.stringify({ ok: true, data: { content: "hi" } }),
      },
      { id: "a1", role: "AGENT", content: "read it" },
    ];
    setLogs(entries);
    const a = await buildContextMessages(ctx, { agentId: "a", taskId: null });
    setLogs(entries);
    const b = await buildContextMessages(ctx, { agentId: "a", taskId: null });

    expect(JSON.stringify(a.messages)).toBe(JSON.stringify(b.messages));
  });

  it("skips call-only TOOL entries (null or 'null' toolResult)", async () => {
    setLogs([
      { id: "u1", role: "USER", content: "go" },
      {
        id: "t1",
        role: "TOOL",
        toolName: "foo",
        toolInput: JSON.stringify({ a: 1 }),
        toolResult: null,
      },
      {
        id: "t2",
        role: "TOOL",
        toolName: "foo",
        toolInput: JSON.stringify({ a: 2 }),
        toolResult: "null",
      },
    ]);

    const { messages } = await buildContextMessages(ctx, {
      agentId: "a",
      taskId: null,
    });

    // Only the USER message remains; the call-only tool entries are dropped
    // and no assistant/tool message is emitted for them.
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({ role: "user", content: "go" });
  });

  it("flushes the tool buffer when a non-tool entry breaks the run", async () => {
    setLogs([
      {
        id: "t1",
        role: "TOOL",
        toolName: "a",
        toolInput: "{}",
        toolResult: JSON.stringify({ ok: true }),
      },
      { id: "a1", role: "AGENT", content: "first" },
      {
        id: "t2",
        role: "TOOL",
        toolName: "b",
        toolInput: "{}",
        toolResult: JSON.stringify({ ok: true }),
      },
      { id: "a2", role: "AGENT", content: "second" },
    ]);

    const { messages } = await buildContextMessages(ctx, {
      agentId: "a",
      taskId: null,
    });

    // Expect: assistant(tool-calls)+tool(tool-results)+assistant("first")+
    //         assistant(tool-calls)+tool(tool-results)+assistant("second")
    expect(messages.map((m) => m.role)).toEqual([
      "assistant",
      "tool",
      "assistant",
      "assistant",
      "tool",
      "assistant",
    ]);
    expect(messages[2].content).toBe("first");
    expect(messages[5].content).toBe("second");
  });

  it("resumes after a compaction entry, dropping prior history", async () => {
    setLogs([
      { id: "u1", role: "USER", content: "old stuff" },
      {
        id: "s1",
        role: "SYSTEM",
        content: JSON.stringify({
          type: "compaction",
          summary: "previously: ...",
          compactedCount: 5,
        }),
      },
      { id: "u2", role: "USER", content: "new stuff" },
    ]);

    const { messages } = await buildContextMessages(ctx, {
      agentId: "a",
      taskId: null,
    });

    // First message is the compaction summary; entries before it are dropped.
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain("Context summary");
    expect(messages[messages.length - 1]).toEqual({
      role: "user",
      content: "new stuff",
    });
  });
});
