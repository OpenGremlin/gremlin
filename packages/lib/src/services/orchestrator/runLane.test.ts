import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { runLane } from "./runLane.js";

vi.mock("./compaction.js", () => ({
  buildContextMessages: vi.fn(),
  estimateContextTokens: vi.fn().mockReturnValue(1000),
  maybeCompact: vi.fn().mockResolvedValue(undefined),
  DEFAULT_MAX_TOKENS: 200_000,
  PRE_PROMPT_COMPACTION_RATIO: 0.9,
}));

vi.mock("./model.js", () => ({
  getModelForAgent: vi.fn().mockResolvedValue({
    model: {},
    maxInputTokens: 200_000,
  }),
}));

vi.mock("./runAgentTurn.js", () => ({
  runAgentTurn: vi.fn(),
}));

vi.mock("./writeAgentLog.js", () => ({
  writeAgentLog: vi.fn().mockResolvedValue({ id: "log-1", createdAt: "t" }),
  updateAgentLogResult: vi.fn(),
}));

vi.mock("./buildMemoryContext.js", () => ({
  buildMemoryContext: vi.fn().mockReturnValue(undefined),
}));

// Import mocked modules so we can configure them per-test
const { buildContextMessages, estimateContextTokens, maybeCompact } =
  await import("./compaction.js");
const { runAgentTurn } = await import("./runAgentTurn.js");
const { writeAgentLog } = await import("./writeAgentLog.js");

function defaultConfig() {
  return {
    agentId: "agent-1",
    taskId: "task-1" as string | null,
    systemPrompt: "You are a test agent.",
    tools: {},
    timezone: "UTC",
  };
}

describe("runLane", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    ctx.services.memory.recallMemories.mockResolvedValue({
      recent: [],
      relevant: [],
    });
    ctx.services.memory.getCoreMemories.mockResolvedValue([]);

    (buildContextMessages as Mock).mockResolvedValue({
      messages: [{ role: "user", content: "hello" }],
    });
  });

  it("returns agent response on success", async () => {
    (runAgentTurn as Mock).mockResolvedValue("I can help with that!");

    const result = await runLane(ctx, defaultConfig());

    expect(result).toBe("I can help with that!");
    expect(runAgentTurn).toHaveBeenCalledTimes(1);
    expect(writeAgentLog).not.toHaveBeenCalled();
  });

  it("writes a SYSTEM error log when the first turn fails", async () => {
    (runAgentTurn as Mock)
      .mockRejectedValueOnce(
        new Error("Unsupported image mime type: image/heic"),
      )
      .mockResolvedValueOnce("Sorry, that image format isn't supported.");

    const result = await runLane(ctx, defaultConfig());

    expect(result).toBe("Sorry, that image format isn't supported.");

    // Error was logged as a SYSTEM entry
    expect(writeAgentLog).toHaveBeenCalledTimes(1);
    const logCall = (writeAgentLog as Mock).mock.calls[0];
    expect(logCall[1]).toMatchObject({
      agentId: "agent-1",
      taskId: "task-1",
      role: "SYSTEM",
    });
    const content = JSON.parse(logCall[1].content);
    expect(content.type).toBe("error");
    expect(content.message).toContain("image/heic");
  });

  it("rebuilds context for the recovery turn", async () => {
    const recoveryMessages = [
      { role: "user", content: "hello" },
      { role: "assistant", content: '{"type":"error","message":"boom"}' },
    ];
    (buildContextMessages as Mock)
      .mockResolvedValueOnce({
        messages: [{ role: "user", content: "hello" }],
      })
      .mockResolvedValueOnce({
        messages: recoveryMessages,
      });

    (runAgentTurn as Mock)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await runLane(ctx, defaultConfig());

    // Recovery turn should use freshly rebuilt messages
    expect(buildContextMessages).toHaveBeenCalledTimes(2);
    const recoveryCall = (runAgentTurn as Mock).mock.calls[1];
    expect(recoveryCall[1].messages).toBe(recoveryMessages);
  });

  it("writes fallback AGENT log when recovery also fails", async () => {
    (runAgentTurn as Mock)
      .mockRejectedValueOnce(new Error("bad image"))
      .mockRejectedValueOnce(new Error("bad image again"));

    const result = await runLane(ctx, defaultConfig());

    expect(result).toContain("encountered an error");
    // Only two attempts total — no retry loop
    expect(runAgentTurn).toHaveBeenCalledTimes(2);
    // Two log writes: SYSTEM error + fallback AGENT response
    expect(writeAgentLog).toHaveBeenCalledTimes(2);
    const agentLog = (writeAgentLog as Mock).mock.calls[1];
    expect(agentLog[1]).toMatchObject({
      role: "AGENT",
      agentId: "agent-1",
      taskId: "task-1",
    });
  });

  it("does not throw when recovery fails — drain loop stays alive", async () => {
    (runAgentTurn as Mock)
      .mockRejectedValueOnce(new Error("poison pill"))
      .mockRejectedValueOnce(new Error("still poisoned"));

    // This must not throw — previously it would kill the consumer drain loop
    await expect(runLane(ctx, defaultConfig())).resolves.toContain(
      "encountered an error",
    );
  });

  it("only attempts recovery once, not a retry loop", async () => {
    (runAgentTurn as Mock).mockRejectedValue(new Error("always fails"));

    await runLane(ctx, defaultConfig());

    // Exactly 2 calls: initial + one recovery. No loop.
    expect(runAgentTurn).toHaveBeenCalledTimes(2);
  });
});

describe("runLane pre-prompt compaction guard", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    ctx.services.memory.recallMemories.mockResolvedValue({
      recent: [],
      relevant: [],
    });
    ctx.services.memory.getCoreMemories.mockResolvedValue([]);
    (runAgentTurn as Mock).mockResolvedValue("response");
    // Default: estimate well below the 90% threshold (200_000 * 0.9 = 180_000).
    (estimateContextTokens as Mock).mockReturnValue(1000);
  });

  it("compacts and rebuilds messages when context exceeds the pre-prompt threshold", async () => {
    const originalMessages = [{ role: "user", content: "old message" }];
    const rebuiltMessages = [
      { role: "user", content: "[summary] ..." },
      { role: "user", content: "recent" },
    ];

    (buildContextMessages as Mock)
      .mockResolvedValueOnce({ messages: originalMessages })
      .mockResolvedValueOnce({ messages: rebuiltMessages });

    // First estimate: above threshold. Second (post-rebuild): below.
    (estimateContextTokens as Mock)
      .mockReturnValueOnce(190_000)
      .mockReturnValueOnce(20_000);

    await runLane(ctx, defaultConfig());

    expect(maybeCompact).toHaveBeenCalled();
    expect(buildContextMessages).toHaveBeenCalledTimes(2);

    // runAgentTurn must receive the rebuilt messages, not the originals.
    const turnArgs = (runAgentTurn as Mock).mock.calls[0][1];
    expect(turnArgs.messages).toEqual(rebuiltMessages);
  });

  it("does not invoke pre-prompt compaction when context is below the threshold", async () => {
    (buildContextMessages as Mock).mockResolvedValue({
      messages: [{ role: "user", content: "hi" }],
    });
    (estimateContextTokens as Mock).mockReturnValue(10_000);

    await runLane(ctx, defaultConfig());

    // Only one buildContextMessages call (no rebuild after compaction).
    expect(buildContextMessages).toHaveBeenCalledTimes(1);
    // maybeCompact is still called once, but only as the post-turn fire-and-forget.
    expect(maybeCompact).toHaveBeenCalledTimes(1);
  });

  it("proceeds with original context when pre-prompt compaction throws", async () => {
    const originalMessages = [{ role: "user", content: "old" }];
    (buildContextMessages as Mock).mockResolvedValue({
      messages: originalMessages,
    });
    (estimateContextTokens as Mock).mockReturnValue(190_000);
    (maybeCompact as Mock).mockRejectedValueOnce(new Error("summarizer down"));

    await expect(runLane(ctx, defaultConfig())).resolves.toBe("response");

    expect(ctx.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ component: "compaction" }),
      expect.stringContaining("Pre-prompt compaction failed"),
    );
    // runAgentTurn still runs with the original (oversized) messages.
    const turnArgs = (runAgentTurn as Mock).mock.calls[0][1];
    expect(turnArgs.messages).toEqual(originalMessages);
    // maybeCompact called twice: once in the guard (rejected), once post-turn.
    expect(maybeCompact).toHaveBeenCalledTimes(2);
  });

  it("logs a warning when context remains above the threshold after compaction", async () => {
    (buildContextMessages as Mock)
      .mockResolvedValueOnce({ messages: [{ role: "user", content: "a" }] })
      .mockResolvedValueOnce({ messages: [{ role: "user", content: "b" }] });
    // Both estimates above 180_000 — compaction didn't help.
    (estimateContextTokens as Mock)
      .mockReturnValueOnce(190_000)
      .mockReturnValueOnce(185_000);

    await runLane(ctx, defaultConfig());

    expect(ctx.log.warn).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining("still over threshold"),
    );
  });
});
