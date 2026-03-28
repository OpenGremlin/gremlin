import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { runLane } from "./runLane.js";

vi.mock("./compaction.js", () => ({
  buildContextMessages: vi.fn(),
  maybeCompact: vi.fn().mockResolvedValue(undefined),
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
const { buildContextMessages } = await import("./compaction.js");
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
      postCompactionCount: 1,
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
        postCompactionCount: 1,
      })
      .mockResolvedValueOnce({
        messages: recoveryMessages,
        postCompactionCount: 2,
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

  it("returns empty string when recovery turn also fails", async () => {
    (runAgentTurn as Mock)
      .mockRejectedValueOnce(new Error("bad image"))
      .mockRejectedValueOnce(new Error("bad image again"));

    const result = await runLane(ctx, defaultConfig());

    expect(result).toBe("");
    // Only two attempts total — no retry loop
    expect(runAgentTurn).toHaveBeenCalledTimes(2);
    // One error log written (for the first failure; recovery failure just returns)
    expect(writeAgentLog).toHaveBeenCalledTimes(1);
  });

  it("does not throw when recovery fails — drain loop stays alive", async () => {
    (runAgentTurn as Mock)
      .mockRejectedValueOnce(new Error("poison pill"))
      .mockRejectedValueOnce(new Error("still poisoned"));

    // This must not throw — previously it would kill the consumer drain loop
    await expect(runLane(ctx, defaultConfig())).resolves.toBe("");
  });

  it("only attempts recovery once, not a retry loop", async () => {
    (runAgentTurn as Mock).mockRejectedValue(new Error("always fails"));

    await runLane(ctx, defaultConfig());

    // Exactly 2 calls: initial + one recovery. No loop.
    expect(runAgentTurn).toHaveBeenCalledTimes(2);
  });
});
