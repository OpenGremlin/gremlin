import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";

vi.mock("../orchestrator/model.js", () => ({
  invalidateModelCache: vi.fn(),
}));

import { removeProviderApiKey } from "./removeProviderApiKey.js";
import { invalidateModelCache } from "../orchestrator/model.js";

describe("removeProviderApiKey", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("deletes the key and clears default model when it matches the provider", async () => {
    // Delete key
    const mockDeleteSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockDeleteSend }),
    } as any);

    // Get default model setting — matches provider being removed
    const stored = { providerId: "anthropic", modelId: "claude-opus-4-20250514" };
    const mockSettingGetSend = vi.fn().mockResolvedValue({
      Item: { key: "defaultModel", value: JSON.stringify(stored) },
    });

    // Delete default model setting
    const mockSettingDeleteSend = vi.fn().mockResolvedValue({});

    ctx.resources.ddb.entities.Setting.build
      .mockReturnValueOnce({
        key: vi.fn().mockReturnValue({ send: mockSettingGetSend }),
      } as any)
      .mockReturnValueOnce({
        key: vi.fn().mockReturnValue({ send: mockSettingDeleteSend }),
      } as any);

    await removeProviderApiKey(ctx, "anthropic");

    expect(mockDeleteSend).toHaveBeenCalled();
    expect(mockSettingDeleteSend).toHaveBeenCalled();
    expect(invalidateModelCache).toHaveBeenCalled();
  });

  it("keeps default model when it uses a different provider", async () => {
    const mockDeleteSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockDeleteSend }),
    } as any);

    const stored = { providerId: "openai", modelId: "gpt-4.1" };
    const mockSettingGetSend = vi.fn().mockResolvedValue({
      Item: { key: "defaultModel", value: JSON.stringify(stored) },
    });

    ctx.resources.ddb.entities.Setting.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockSettingGetSend }),
    } as any);

    await removeProviderApiKey(ctx, "anthropic");

    // Setting.build should only be called once (the get), not twice (no delete)
    expect(ctx.resources.ddb.entities.Setting.build).toHaveBeenCalledTimes(1);
    expect(invalidateModelCache).toHaveBeenCalled();
  });

  it("handles no default model setting gracefully", async () => {
    const mockDeleteSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockDeleteSend }),
    } as any);

    ctx.resources.ddb.entities.Setting.build.mockReturnValue({
      key: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ Item: undefined }),
      }),
    } as any);

    await removeProviderApiKey(ctx, "anthropic");

    expect(ctx.resources.ddb.entities.Setting.build).toHaveBeenCalledTimes(1);
    expect(invalidateModelCache).toHaveBeenCalled();
  });
});
