import { describe, expect, it } from "vitest";
import { createMockContext } from "../../../__testing__/mockContext.js";
import { scriptedModel } from "../../../__testing__/scriptedModel/index.js";
import { getModelForAgent } from "./getModelForAgent.js";
import { getModelResult } from "./getModelResult.js";

// These tests pin the override *contract* at the resolver boundary so a refactor
// that reorders the check (e.g. fetching the agent first) fails here with a clear
// reason, not somewhere downstream via a proxy-returned undefined.

describe("ctx.modelOverride short-circuits model resolution", () => {
  it("getModelResult returns the override without consulting integrations service", async () => {
    const ctx = createMockContext();
    const model = scriptedModel([[{ kind: "text", text: "x" }]]);
    ctx.modelOverride = { model, maxInputTokens: 4096 };

    const result = await getModelResult(ctx);

    expect(result.model).toBe(model);
    expect(result.maxInputTokens).toBe(4096);
    expect(ctx.services.integrations.getDefaultModel).not.toHaveBeenCalled();
    expect(ctx.services.integrations.getProviderApiKey).not.toHaveBeenCalled();
  });

  it("getModelResult returns override without maxInputTokens when none provided", async () => {
    const ctx = createMockContext();
    const model = scriptedModel([[{ kind: "text", text: "x" }]]);
    ctx.modelOverride = { model };

    const result = await getModelResult(ctx);

    expect(result.model).toBe(model);
    expect(result.maxInputTokens).toBeUndefined();
  });

  it("getModelForAgent returns the override without fetching the agent record", async () => {
    const ctx = createMockContext();
    const model = scriptedModel([[{ kind: "text", text: "x" }]]);
    ctx.modelOverride = { model, maxInputTokens: 8192 };

    const result = await getModelForAgent(ctx, "agent-1");

    expect(result.model).toBe(model);
    expect(result.maxInputTokens).toBe(8192);
    expect(ctx.services.agents.getAgent).not.toHaveBeenCalled();
  });
});
