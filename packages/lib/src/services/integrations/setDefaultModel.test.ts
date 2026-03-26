import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import type { EnabledModel } from "./getEnabledModels.js";
import { setDefaultModel } from "./setDefaultModel.js";

vi.mock("./getEnabledModels.js", () => ({
  getEnabledModels: vi.fn(),
}));
vi.mock("../orchestrator/model.js", () => ({
  invalidateModelCache: vi.fn(),
}));

const { getEnabledModels } = await import("./getEnabledModels.js");

function model(id: string, name?: string): EnabledModel {
  return {
    id,
    name: name ?? id,
    mode: "chat",
  };
}

describe("setDefaultModel", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("throws for unknown provider", async () => {
    await expect(
      setDefaultModel(ctx, "nonexistent", "some-model"),
    ).rejects.toThrow("Unknown AI provider: nonexistent");
  });

  it("throws for non-AI provider", async () => {
    await expect(setDefaultModel(ctx, "github", "some-model")).rejects.toThrow(
      "Unknown AI provider: github",
    );
  });

  it("throws when model is not enabled", async () => {
    vi.mocked(getEnabledModels).mockResolvedValue([
      model("us.anthropic.claude-sonnet-4-6", "Claude Sonnet 4.6"),
    ]);

    await expect(
      setDefaultModel(ctx, "bedrock", "us.anthropic.claude-opus-4-6-v1"),
    ).rejects.toThrow("Model not enabled");
  });

  it("succeeds for enabled bedrock model", async () => {
    vi.mocked(getEnabledModels).mockResolvedValue([
      model("us.anthropic.claude-sonnet-4-6", "Claude Sonnet 4.6"),
    ]);

    const mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.DefaultModel.build.mockReturnValue({
      item: mockItem,
    } as any);

    await setDefaultModel(ctx, "bedrock", "us.anthropic.claude-sonnet-4-6");

    expect(mockItem).toHaveBeenCalledWith({
      modelType: "chat",
      providerId: "bedrock",
      modelId: "us.anthropic.claude-sonnet-4-6",
      modelName: "Claude Sonnet 4.6",
    });
  });

  it("throws when apikey provider model is not enabled", async () => {
    vi.mocked(getEnabledModels).mockResolvedValue([]);

    await expect(
      setDefaultModel(ctx, "anthropic", "claude-sonnet-4-6"),
    ).rejects.toThrow("Model not enabled");
  });

  it("succeeds for enabled apikey provider model", async () => {
    vi.mocked(getEnabledModels).mockResolvedValue([model("claude-sonnet-4-6")]);

    const mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.DefaultModel.build.mockReturnValue({
      item: mockItem,
    } as any);

    await setDefaultModel(ctx, "anthropic", "claude-sonnet-4-6");

    expect(mockItem).toHaveBeenCalledWith({
      modelType: "chat",
      providerId: "anthropic",
      modelId: "claude-sonnet-4-6",
      modelName: "claude-sonnet-4-6",
    });
  });
});
