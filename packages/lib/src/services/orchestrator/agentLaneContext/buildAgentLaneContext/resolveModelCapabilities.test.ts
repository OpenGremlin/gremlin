import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../../__testing__/mockContext.js";
import type { ServiceContext } from "../../../context.js";
import { resolveModelCapabilities } from "./resolveModelCapabilities.js";

describe("resolveModelCapabilities", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns permissive defaults when agentModel is null/undefined", async () => {
    await expect(resolveModelCapabilities(ctx, null)).resolves.toEqual({
      supportsImages: true,
      supportsReasoning: false,
    });
    await expect(resolveModelCapabilities(ctx, undefined)).resolves.toEqual({
      supportsImages: true,
      supportsReasoning: false,
    });
  });

  it("returns defaults when type is unrecognised", async () => {
    await expect(
      resolveModelCapabilities(ctx, { type: "mystery" }),
    ).resolves.toEqual({ supportsImages: true, supportsReasoning: false });
    // Ask no questions if the integrations layer was never called.
    expect(ctx.services.integrations.getEnabledModels).not.toHaveBeenCalled();
  });

  it("looks up capabilities from getEnabledModels for bedrock models", async () => {
    ctx.services.integrations.getEnabledModels.mockResolvedValue([
      {
        id: "anthropic.claude-sonnet-4-6",
        supportedModalities: ["text", "image"],
        supportsReasoning: true,
      } as any,
    ]);

    const caps = await resolveModelCapabilities(ctx, {
      type: "bedrock",
      modelId: "anthropic.claude-sonnet-4-6",
    });

    expect(caps).toEqual({ supportsImages: true, supportsReasoning: true });
    expect(ctx.services.integrations.getEnabledModels).toHaveBeenCalledWith(
      ctx.resources,
      "bedrock",
    );
  });

  it("splits connectionId on ':' for connection-type models", async () => {
    ctx.services.integrations.getEnabledModels.mockResolvedValue([
      {
        id: "gpt-5",
        supportedModalities: ["text"],
        supportsReasoning: false,
      } as any,
    ]);

    const caps = await resolveModelCapabilities(ctx, {
      type: "connection",
      connectionId: "openai:gpt-5",
    });

    expect(caps).toEqual({ supportsImages: false, supportsReasoning: false });
    expect(ctx.services.integrations.getEnabledModels).toHaveBeenCalledWith(
      ctx.resources,
      "openai",
    );
  });

  it("treats missing supportedModalities as image-capable (permissive)", async () => {
    ctx.services.integrations.getEnabledModels.mockResolvedValue([
      { id: "mystery-model" } as any,
    ]);
    const caps = await resolveModelCapabilities(ctx, {
      type: "bedrock",
      modelId: "mystery-model",
    });
    expect(caps.supportsImages).toBe(true);
  });

  it("falls back to defaults when getEnabledModels throws", async () => {
    ctx.services.integrations.getEnabledModels.mockRejectedValue(
      new Error("ddb down"),
    );
    const caps = await resolveModelCapabilities(ctx, {
      type: "bedrock",
      modelId: "anthropic.claude-sonnet-4-6",
    });
    expect(caps).toEqual({ supportsImages: true, supportsReasoning: false });
  });

  it("falls back to defaults when the model is not in the registry", async () => {
    ctx.services.integrations.getEnabledModels.mockResolvedValue([
      { id: "something-else" } as any,
    ]);
    const caps = await resolveModelCapabilities(ctx, {
      type: "bedrock",
      modelId: "missing",
    });
    expect(caps).toEqual({ supportsImages: true, supportsReasoning: false });
  });
});
