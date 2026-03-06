import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { updateProfile } from "./updateProfile.js";

describe("updateProfile", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  function mockPut() {
    const mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Profile.build.mockReturnValue({
      item: mockItem,
    } as any);
    return { mockItem, mockSend };
  }

  it("returns the profile item", async () => {
    mockPut();

    const result = await updateProfile(ctx, {
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
    });

    expect(result).toEqual({
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: null,
      timezone: null,
    });
  });

  it("defaults website to null when not provided", async () => {
    const { mockItem } = mockPut();

    await updateProfile(ctx, {
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      timezone: "America/New_York",
    });

    expect(mockItem).toHaveBeenCalledWith({
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: null,
      timezone: "America/New_York",
    });
  });

  it("defaults timezone to null when not provided", async () => {
    const { mockItem } = mockPut();

    await updateProfile(ctx, {
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
    });

    expect(mockItem).toHaveBeenCalledWith({
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
      timezone: null,
    });
  });

  it("passes all fields when provided", async () => {
    const { mockItem } = mockPut();

    const result = await updateProfile(ctx, {
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
      timezone: "America/New_York",
    });

    expect(mockItem).toHaveBeenCalledWith({
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
      timezone: "America/New_York",
    });

    expect(result).toEqual({
      name: "alice",
      displayName: "Alice",
      about: "Hello world",
      website: "https://alice.dev",
      timezone: "America/New_York",
    });
  });
});
