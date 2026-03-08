import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getDefaultModel } from "./getDefaultModel.js";

describe("getDefaultModel", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns parsed default model when setting exists", async () => {
    const stored = {
      providerId: "anthropic",
      modelId: "claude-opus-4-20250514",
    };
    const mockSend = vi.fn().mockResolvedValue({
      Item: { key: "defaultModel", value: JSON.stringify(stored) },
    });
    ctx.resources.ddb.entities.Setting.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockSend }),
    } as any);

    const result = await getDefaultModel(ctx);

    expect(result).toEqual(stored);
  });

  it("returns null when setting does not exist", async () => {
    const mockSend = vi.fn().mockResolvedValue({ Item: undefined });
    ctx.resources.ddb.entities.Setting.build.mockReturnValue({
      key: vi.fn().mockReturnValue({ send: mockSend }),
    } as any);

    const result = await getDefaultModel(ctx);

    expect(result).toBeNull();
  });
});
