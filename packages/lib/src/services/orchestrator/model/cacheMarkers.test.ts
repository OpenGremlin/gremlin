import { describe, expect, it } from "vitest";
import { asCacheCapableProvider, cacheMarker } from "./cacheMarkers.js";

describe("asCacheCapableProvider", () => {
  it("normalizes amazon-bedrock and its bedrock alias", () => {
    // Regression guard: gremlin got zero cache hits in prod because the
    // AI SDK reports `.provider = "amazon-bedrock"` but earlier code
    // only matched the literal "bedrock".
    expect(asCacheCapableProvider("amazon-bedrock")).toBe("amazon-bedrock");
    expect(asCacheCapableProvider("bedrock")).toBe("amazon-bedrock");
  });

  it("recognizes anthropic direct", () => {
    expect(asCacheCapableProvider("anthropic")).toBe("anthropic");
  });

  it("returns null for providers without explicit caching", () => {
    for (const p of [
      "openai",
      "google_ai",
      "xai",
      "mistral",
      "deepseek",
      "groq",
      "perplexity",
      "together",
      "fireworks",
      "cohere",
      "minimax",
      "qwen",
    ]) {
      expect(asCacheCapableProvider(p)).toBeNull();
    }
  });
});

describe("cacheMarker", () => {
  it("emits bedrock cachePoint with 5m TTL by default", () => {
    expect(cacheMarker("amazon-bedrock")).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "5m" } },
    });
  });

  it("emits bedrock cachePoint with 1h TTL when requested", () => {
    expect(cacheMarker("amazon-bedrock", { ttl: "1h" })).toEqual({
      bedrock: { cachePoint: { type: "default", ttl: "1h" } },
    });
  });

  it("emits anthropic cacheControl ephemeral", () => {
    expect(cacheMarker("anthropic", { ttl: "1h" })).toEqual({
      anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } },
    });
  });
});
