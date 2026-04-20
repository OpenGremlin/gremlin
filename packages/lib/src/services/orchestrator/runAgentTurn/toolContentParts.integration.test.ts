import type { MockLanguageModelV3 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { scriptedModel } from "../../__testing__/scriptedModel/index.js";
import { buildContextMessages } from "../compaction/buildContextMessages.js";

// End-to-end guard: tool entries stored in DDB must be reconstructed as
// proper AI SDK tool-call + tool-result content parts AND those content
// parts must survive the AI SDK → Bedrock binding normalization intact.
//
// The original `amazon-bedrock` typo regression made the cost of silent
// shape drift clear. A pure unit test on buildContextMessages could still
// pass while the binding rejects or drops the content parts on the wire.
// This test captures the real prompt that reaches the model.

vi.mock("../writeAgentLog.js", () => ({
  writeAgentLog: vi.fn().mockResolvedValue({ id: "log-1", createdAt: "t" }),
  updateAgentLogResult: vi.fn(),
}));

vi.mock("./streamSpeech.js", () => ({
  createSpeechPipeline: () => ({
    pushText: () => {},
    finish: () => {},
  }),
}));

const { runAgentTurn } = await import("./index.js");

describe("tool content parts through AI SDK to Bedrock", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
  });

  it("reconstructs tool-call/tool-result pairs and passes them to the model", async () => {
    // Seed a conversation history that includes two tool calls in DDB.
    ctx.services.agentLogs.getAgentLogs.mockResolvedValue({
      edges: [
        { node: { id: "u1", role: "USER", content: "read both configs" } },
        {
          node: {
            id: "tool-call-A",
            role: "TOOL",
            toolName: "readFile",
            toolInput: JSON.stringify({ path: "/etc/a.conf" }),
            toolResult: JSON.stringify({ ok: true, data: "alpha=1" }),
          },
        },
        {
          node: {
            id: "tool-call-B",
            role: "TOOL",
            toolName: "readFile",
            toolInput: JSON.stringify({ path: "/etc/b.conf" }),
            toolResult: JSON.stringify({ ok: true, data: "beta=2" }),
          },
        },
        { node: { id: "a1", role: "AGENT", content: "Both read." } },
      ],
    });

    const { messages } = await buildContextMessages(ctx, {
      agentId: "a1",
      taskId: null,
    });

    const model = scriptedModel([[{ kind: "text", text: "ack" }]], {
      provider: "amazon-bedrock",
    }) as unknown as MockLanguageModelV3;
    ctx.modelOverride = { model };

    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "stable system",
      messages,
    });

    expect(model.doStreamCalls).toHaveLength(1);
    const prompt = model.doStreamCalls[0].prompt;

    // Find the assistant message carrying the tool calls.
    const assistantToolCall = prompt.find(
      (m) =>
        m.role === "assistant" &&
        Array.isArray(m.content) &&
        m.content.some((p) => p.type === "tool-call"),
    );
    expect(assistantToolCall).toBeDefined();
    const calls = (
      assistantToolCall?.content as Array<{
        type: string;
        toolCallId: string;
        toolName: string;
      }>
    ).filter((p) => p.type === "tool-call");
    expect(calls).toHaveLength(2);
    expect(calls.map((c) => c.toolCallId)).toEqual([
      "tool-call-A",
      "tool-call-B",
    ]);
    expect(calls.every((c) => c.toolName === "readFile")).toBe(true);

    // Find the tool message carrying the tool results.
    const toolResultMsg = prompt.find(
      (m) =>
        m.role === "tool" &&
        Array.isArray(m.content) &&
        m.content.some((p) => p.type === "tool-result"),
    );
    expect(toolResultMsg).toBeDefined();
    const results = (
      toolResultMsg?.content as Array<{
        type: string;
        toolCallId: string;
      }>
    ).filter((p) => p.type === "tool-result");
    expect(results.map((r) => r.toolCallId)).toEqual([
      "tool-call-A",
      "tool-call-B",
    ]);
  });

  it("is byte-stable across replays so prompt-cache hits survive", async () => {
    const logs = {
      edges: [
        { node: { id: "u1", role: "USER", content: "do it" } },
        {
          node: {
            id: "t1",
            role: "TOOL",
            toolName: "readFile",
            toolInput: JSON.stringify({ path: "/x" }),
            toolResult: JSON.stringify({ ok: true, data: "x" }),
          },
        },
        { node: { id: "a1", role: "AGENT", content: "done" } },
      ],
    };

    ctx.services.agentLogs.getAgentLogs.mockResolvedValue(logs);
    const first = await buildContextMessages(ctx, {
      agentId: "a1",
      taskId: null,
    });
    ctx.services.agentLogs.getAgentLogs.mockResolvedValue(logs);
    const second = await buildContextMessages(ctx, {
      agentId: "a1",
      taskId: null,
    });

    expect(JSON.stringify(first.messages)).toBe(
      JSON.stringify(second.messages),
    );
  });
});
