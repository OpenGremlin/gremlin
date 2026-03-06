import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { getModelProviders } from "./getModelProviders.js";
import { providerCatalog } from "./providers.js";

describe("getModelProviders", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns all providers with hasApiKey flags", async () => {
    // First provider (anthropic) has a key, others do not
    ctx.resources.ddb.entities.ModelProviderKey.build
      .mockReturnValueOnce({
        key: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Item: { apiKey: "sk-xxx" } }),
        }),
      } as any)
      .mockReturnValueOnce({
        key: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Item: undefined }),
        }),
      } as any)
      .mockReturnValueOnce({
        key: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Item: undefined }),
        }),
      } as any);

    const result = await getModelProviders(ctx);

    expect(result).toHaveLength(providerCatalog.length);
    expect(result[0]).toMatchObject({
      id: "anthropic",
      name: "Anthropic",
      hasApiKey: true,
    });
    expect(result[1]).toMatchObject({
      id: "openai",
      name: "OpenAI",
      hasApiKey: false,
    });
    expect(result[2]).toMatchObject({
      id: "google",
      name: "Google",
      hasApiKey: false,
    });

    // Each provider should have its models
    expect(result[0].models.length).toBeGreaterThan(0);
  });

  it("returns hasApiKey false for all when no keys exist", async () => {
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ Item: undefined }),
      }),
    } as any);

    const result = await getModelProviders(ctx);

    for (const provider of result) {
      expect(provider.hasApiKey).toBe(false);
    }
  });
});
