import { describe, expect, it } from "vitest";
import {
  classifyModelFromStore,
  lookupModelMetadata,
} from "./modelMetadataStore.js";

describe("lookupModelMetadata", () => {
  it("finds OpenAI models by bare ID", () => {
    const meta = lookupModelMetadata("openai", "gpt-4o");
    expect(meta).not.toBeNull();
    expect(meta?.mode).toBe("chat");
  });

  it("finds Anthropic models by bare ID", () => {
    const meta = lookupModelMetadata("anthropic", "claude-sonnet-4-6");
    expect(meta).not.toBeNull();
    expect(meta?.mode).toBe("chat");
  });

  it("finds xAI models by provider-prefixed key", () => {
    const meta = lookupModelMetadata("xai", "grok-3");
    expect(meta).not.toBeNull();
    expect(meta?.mode).toBe("chat");
  });

  it("finds DeepSeek models by provider-prefixed key", () => {
    const meta = lookupModelMetadata("deepseek", "deepseek-chat");
    expect(meta).not.toBeNull();
    expect(meta?.mode).toBe("chat");
  });

  it("finds Mistral models by provider-prefixed key", () => {
    const meta = lookupModelMetadata("mistral", "mistral-large-latest");
    expect(meta).not.toBeNull();
    expect(meta?.mode).toBe("chat");
  });

  it("returns null for unknown models", () => {
    const meta = lookupModelMetadata("openai", "nonexistent-model-xyz");
    expect(meta).toBeNull();
  });

  it("returns null for unknown providers", () => {
    const meta = lookupModelMetadata("unknown_provider", "some-model");
    expect(meta).toBeNull();
  });

  it("includes supportedModalities when present", () => {
    const meta = lookupModelMetadata("openai", "gpt-4o");
    expect(meta).not.toBeNull();
    expect(meta?.supportedModalities).toEqual(expect.arrayContaining(["text"]));
  });

  it("includes supportedOutputModalities when present", () => {
    const meta = lookupModelMetadata("openai", "gpt-4o");
    expect(meta).not.toBeNull();
    expect(meta?.supportedOutputModalities).toEqual(
      expect.arrayContaining(["text"]),
    );
  });

  it("includes outputCostPerImage for image models", () => {
    const meta = lookupModelMetadata("bedrock", "amazon.nova-canvas-v1:0");
    if (meta) {
      expect(meta.outputCostPerImage).toBeTypeOf("number");
    }
  });
});

describe("classifyModelFromStore", () => {
  it("classifies chat models as chat", () => {
    expect(classifyModelFromStore("openai", "gpt-4o")).toBe("chat");
  });

  it("classifies image_generation models as image_generation", () => {
    expect(classifyModelFromStore("openai", "dall-e-3")).toBe(
      "image_generation",
    );
  });

  it("returns null for models not in the store", () => {
    expect(classifyModelFromStore("openai", "totally-fake-model")).toBeNull();
  });

  it("works with provider-prefixed lookups", () => {
    expect(classifyModelFromStore("xai", "grok-3")).toBe("chat");
  });
});
