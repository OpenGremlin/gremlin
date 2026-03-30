import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Resources } from "../../resources/index.js";
import { connectApiKey } from "./connectApiKey.js";

vi.mock("./listProviderModels.js", () => ({
  listProviderModels: vi
    .fn()
    .mockResolvedValue([
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", mode: "chat" },
    ]),
}));

describe("connectApiKey", () => {
  let resources: ReturnType<typeof mockDeep<Resources>>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    resources = mockDeep<Resources>();
    mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    resources.ddb.entities.IntegrationConnection.build.mockReturnValue({
      item: mockItem,
    } as any);
  });

  it("throws for unknown provider", async () => {
    await expect(
      connectApiKey(resources, "nonexistent", "key"),
    ).rejects.toThrow("Unknown provider: nonexistent");
  });

  it("throws for oauth provider", async () => {
    await expect(connectApiKey(resources, "google", "key")).rejects.toThrow(
      "does not support API key connections",
    );
  });

  it("validates key via listProviderModels for model_provider", async () => {
    const { listProviderModels } = await import("./listProviderModels.js");
    const result = await connectApiKey(resources, "anthropic", "sk-test");

    expect(listProviderModels).toHaveBeenCalledWith("anthropic", "sk-test");
    expect(result.models).toHaveLength(1);
    expect(result.connectionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("stores connectionType as model_provider for AI providers", async () => {
    await connectApiKey(resources, "anthropic", "sk-test");

    const itemCall = (resources.ddb.entities.IntegrationConnection.build as any)
      .mock.results[0].value.item.mock.calls[0][0];

    expect(itemCall.connectionType).toBe("model_provider");
    expect(itemCall.connectionMeta.apiKey).toBe("sk-test");
  });

  it("skips model validation for apikey providers", async () => {
    const { listProviderModels } = await import("./listProviderModels.js");
    const result = await connectApiKey(resources, "brave", "BSA-test-key");

    expect(listProviderModels).not.toHaveBeenCalled();
    expect(result.models).toHaveLength(0);
    expect(result.connectionId).toBeTruthy();
  });

  it("stores connectionType as apikey for non-AI providers", async () => {
    await connectApiKey(resources, "brave", "BSA-test-key");

    const itemCall = (resources.ddb.entities.IntegrationConnection.build as any)
      .mock.results[0].value.item.mock.calls[0][0];

    expect(itemCall.connectionType).toBe("apikey");
    expect(itemCall.connectionMeta.apiKey).toBe("BSA-test-key");
  });
});
