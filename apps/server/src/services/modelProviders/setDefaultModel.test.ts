import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";

vi.mock("../orchestrator/model.js", () => ({
  invalidateModelCache: vi.fn(),
}));

import { setDefaultModel } from "./setDefaultModel.js";
import { invalidateModelCache } from "../orchestrator/model.js";

describe("setDefaultModel", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("throws for unknown provider", async () => {
    await expect(
      setDefaultModel(ctx, "unknown-provider", "some-model"),
    ).rejects.toThrow("Unknown provider: unknown-provider");
  });

  it("throws for unknown model within a valid provider", async () => {
    await expect(
      setDefaultModel(ctx, "anthropic", "nonexistent-model"),
    ).rejects.toThrow("Unknown model: nonexistent-model for provider anthropic");
  });

  it("throws when provider has no API key configured", async () => {
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ Item: undefined }),
      }),
    } as any);

    await expect(
      setDefaultModel(ctx, "anthropic", "claude-opus-4-20250514"),
    ).rejects.toThrow("No API key configured for provider: anthropic");
  });

  it("saves default model and invalidates cache when valid", async () => {
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ Item: { apiKey: "sk-xxx" } }),
      }),
    } as any);

    const mockSettingSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.entities.Setting.build.mockReturnValue({
      item: vi.fn().mockReturnValue({ send: mockSettingSend }),
    } as any);

    await setDefaultModel(ctx, "anthropic", "claude-opus-4-20250514");

    expect(mockSettingSend).toHaveBeenCalled();
    expect(invalidateModelCache).toHaveBeenCalled();
  });
});
