import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { setProviderApiKey } from "./setProviderApiKey.js";

describe("setProviderApiKey", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("stores the API key via entity put", async () => {
    const mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.ModelProviderKey.build.mockReturnValue({
      item: mockItem,
    } as any);

    await setProviderApiKey(ctx, "anthropic", "sk-test-key");

    expect(mockItem).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "anthropic",
        apiKey: "sk-test-key",
      }),
    );
    expect(mockSend).toHaveBeenCalled();
  });
});
