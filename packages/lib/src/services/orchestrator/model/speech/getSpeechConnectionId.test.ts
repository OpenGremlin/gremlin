import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../../__testing__/mockContext.js";
import type { ServiceContext } from "../../../context.js";
import { getSpeechConnectionId } from "./getSpeechConnectionId.js";

describe("getSpeechConnectionId", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns the agent-specific connectionId when type=connection", async () => {
    const result = await getSpeechConnectionId(ctx, {
      type: "connection",
      connectionId: "openai:tts-1-hd",
    });
    expect(result).toBe("openai:tts-1-hd");
    expect(ctx.services.integrations.getDefaultModel).not.toHaveBeenCalled();
  });

  it("falls back to system default when config is null", async () => {
    ctx.services.integrations.getDefaultModel.mockResolvedValue({
      providerId: "openai",
      modelId: "tts-1",
    } as any);

    const result = await getSpeechConnectionId(ctx, null);

    expect(result).toBe("openai:tts-1");
    expect(ctx.services.integrations.getDefaultModel).toHaveBeenCalledWith(
      ctx,
      "defaultSpeechModel",
    );
  });

  it("returns null when no default is set", async () => {
    ctx.services.integrations.getDefaultModel.mockResolvedValue(null as any);
    await expect(getSpeechConnectionId(ctx, undefined)).resolves.toBeNull();
  });

  it("swallows getDefaultModel errors and returns null", async () => {
    ctx.services.integrations.getDefaultModel.mockRejectedValue(
      new Error("ddb down"),
    );
    await expect(getSpeechConnectionId(ctx, null)).resolves.toBeNull();
  });

  it("falls back to default when config has wrong type", async () => {
    ctx.services.integrations.getDefaultModel.mockResolvedValue({
      providerId: "openai",
      modelId: "tts-1",
    } as any);

    const result = await getSpeechConnectionId(ctx, {
      type: "bedrock",
      modelId: "foo",
    });

    expect(result).toBe("openai:tts-1");
  });
});
