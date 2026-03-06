import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { getProfile } from "./getProfile.js";

describe("getProfile", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns profile when found", async () => {
    const profileItem = {
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
      timezone: "America/New_York",
    };

    const mockSend = vi.fn().mockResolvedValue({ Item: profileItem });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Profile.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getProfile(ctx, "alice");

    expect(result).toEqual(profileItem);
    expect(mockKey).toHaveBeenCalledWith({ name: "alice" });
  });

  it("returns null when not found", async () => {
    const mockSend = vi.fn().mockResolvedValue({ Item: undefined });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Profile.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getProfile(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
