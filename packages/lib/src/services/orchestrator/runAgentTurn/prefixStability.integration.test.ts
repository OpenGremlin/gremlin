import type { MockLanguageModelV3 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { scriptedModel } from "../../__testing__/scriptedModel/index.js";

// Verifies two invariants that, if broken, silently ruin prompt-cache hit
// rates on Bedrock/Anthropic:
//   (a) The cached prefix is byte-identical turn-over-turn.
//   (b) Cache markers land on the right messages for each provider.

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

function makeBedrockModel() {
  // "amazon-bedrock" is what createAmazonBedrock() reports as its provider
  // string. Earlier this test fixture used "bedrock" and the implementation
  // silently matched the wrong alias, which let a prod regression slip
  // through. Keep this in sync with the real SDK string.
  return scriptedModel([[{ kind: "text", text: "ok" }]], {
    provider: "amazon-bedrock",
  }) as unknown as MockLanguageModelV3;
}

function makeOpenaiModel() {
  return scriptedModel([[{ kind: "text", text: "ok" }]], {
    provider: "openai",
  }) as unknown as MockLanguageModelV3;
}

describe("runAgentTurn prefix stability and cache markers", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
  });

  it("captures a bedrock cache marker on the system message", async () => {
    const model = makeBedrockModel();
    ctx.modelOverride = { model };

    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "stable identity here",
      memoryContext: "some recalled memory",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(model.doStreamCalls).toHaveLength(1);
    const prompt = model.doStreamCalls[0].prompt;
    // System is the first message and carries the 1h cache marker. 1h must
    // appear before any 5m marker (Anthropic TTL-ordering constraint).
    expect(prompt[0].role).toBe("system");
    expect(prompt[0].providerOptions).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "1h" } },
    });
  });

  it("keeps memoryContext OUT of the cached system message", async () => {
    const model = makeBedrockModel();
    ctx.modelOverride = { model };

    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "stable identity here",
      memoryContext: "dynamic memory turn 1",
      messages: [{ role: "user", content: "hi" }],
    });

    const prompt = model.doStreamCalls[0].prompt;
    // System content must be *exactly* the stable prompt — no time, no memory.
    const sys = prompt[0];
    // AI SDK wraps string content into a parts array on the wire.
    const sysText =
      typeof sys.content === "string"
        ? sys.content
        : sys.content.map((p) => ("text" in p ? p.text : "")).join("");
    expect(sysText).toBe("stable identity here");
    expect(sysText).not.toContain("dynamic memory");
  });

  it("produces a byte-identical cached prefix across turns", async () => {
    // Turn 1
    const m1 = makeBedrockModel();
    ctx.modelOverride = { model: m1 };
    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "stable identity here",
      memoryContext: "memory varies A",
      messages: [{ role: "user", content: "first" }],
    });

    // Turn 2 — same agent, same system prompt, but memory and history differ
    // (as they will in reality). The cached portion (system) must be identical.
    const m2 = makeBedrockModel();
    ctx.modelOverride = { model: m2 };
    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "stable identity here",
      memoryContext: "memory varies B",
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "reply one" },
        { role: "user", content: "second" },
      ],
    });

    const sys1 = m1.doStreamCalls[0].prompt[0];
    const sys2 = m2.doStreamCalls[0].prompt[0];
    expect(JSON.stringify(sys1)).toBe(JSON.stringify(sys2));
  });

  it("emits no cache markers for openai (auto-caching provider)", async () => {
    const model = makeOpenaiModel();
    ctx.modelOverride = { model };

    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "sys",
      memoryContext: "mem",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });

    const prompt = model.doStreamCalls[0].prompt;
    for (const m of prompt) {
      expect(m.providerOptions).toBeUndefined();
    }
  });

  it("attaches the 5m rolling marker to the last assistant message on bedrock", async () => {
    const model = makeBedrockModel();
    ctx.modelOverride = { model };

    await runAgentTurn(ctx, {
      agentId: "a1",
      taskId: null,
      systemPrompt: "sys",
      messages: [
        { role: "user", content: "u1" },
        { role: "assistant", content: "a1" },
        { role: "user", content: "u2" },
        { role: "assistant", content: "a2-last" },
        { role: "user", content: "u3" },
      ],
    });

    const prompt = model.doStreamCalls[0].prompt;
    // Locate the assistant with content "a2-last"
    const lastAssistant = prompt.find(
      (m) =>
        m.role === "assistant" && JSON.stringify(m.content).includes("a2-last"),
    );
    expect(lastAssistant?.providerOptions).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "5m" } },
    });
  });
});
