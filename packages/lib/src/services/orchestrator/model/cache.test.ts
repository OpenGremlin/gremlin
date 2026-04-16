import type { LanguageModel } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCached,
  invalidateModelCache,
  type ModelResult,
  setCached,
} from "./cache.js";

function fakeResult(): ModelResult {
  return {
    model: { provider: "bedrock", modelId: "fake" } as unknown as LanguageModel,
    maxInputTokens: 100_000,
  };
}

describe("model cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    invalidateModelCache();
  });

  it("returns null before anything is cached", () => {
    expect(getCached()).toBeNull();
  });

  it("returns the stored result while fresh", () => {
    const r = fakeResult();
    setCached(r);
    expect(getCached()).toBe(r);
  });

  it("invalidateModelCache clears the entry", () => {
    setCached(fakeResult());
    invalidateModelCache();
    expect(getCached()).toBeNull();
  });

  it("expires after the 30s TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T00:00:00Z"));
    setCached(fakeResult());

    vi.setSystemTime(new Date("2026-04-16T00:00:29Z"));
    expect(getCached()).not.toBeNull();

    vi.setSystemTime(new Date("2026-04-16T00:00:31Z"));
    expect(getCached()).toBeNull();
  });

  it("latest setCached wins", () => {
    const a = fakeResult();
    const b = fakeResult();
    setCached(a);
    setCached(b);
    expect(getCached()).toBe(b);
  });
});
