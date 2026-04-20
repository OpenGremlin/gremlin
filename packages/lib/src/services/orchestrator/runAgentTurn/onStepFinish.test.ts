import { describe, expect, it, vi } from "vitest";
import { createMockContext } from "../../__testing__/mockContext.js";
import { createOnStepFinish } from "./onStepFinish.js";

vi.mock("../writeAgentLog.js", () => ({
  writeAgentLog: vi.fn().mockResolvedValue({ id: "log-1", createdAt: "t" }),
  updateAgentLogResult: vi.fn(),
}));

describe("onStepFinish usage logging", () => {
  it("logs token counts including cache read/write fields when usage is present", async () => {
    const ctx = createMockContext();
    const handler = createOnStepFinish(ctx, {
      agentId: "a",
      taskId: null,
      callLogIds: new Map(),
      flags: { pendingApproval: false },
    });

    await handler({
      toolCalls: [],
      toolResults: [],
      usage: {
        inputTokens: 100,
        outputTokens: 10,
        cachedInputTokens: 80,
      },
      providerMetadata: {
        bedrock: { usage: { cacheWriteInputTokens: 5 } },
      },
    });

    const logCalls = (ctx.log.info as ReturnType<typeof vi.fn>).mock.calls;
    const usageCall = logCalls.find((c) => c[1] === "Model step usage");
    expect(usageCall).toBeDefined();
    expect(usageCall?.[0]).toMatchObject({
      agentId: "a",
      component: "model",
      inputTokens: 100,
      outputTokens: 10,
      cachedInputTokens: 80,
      cacheWriteTokens: 5,
    });
  });

  it("does not log usage when neither usage nor providerMetadata is present", async () => {
    const ctx = createMockContext();
    const handler = createOnStepFinish(ctx, {
      agentId: "a",
      taskId: null,
      callLogIds: new Map(),
      flags: { pendingApproval: false },
    });

    await handler({ toolCalls: [], toolResults: [] });

    const logCalls = (ctx.log.info as ReturnType<typeof vi.fn>).mock.calls;
    expect(logCalls.find((c) => c[1] === "Model step usage")).toBeUndefined();
  });
});
