import { afterEach, describe, expect, it } from "vitest";
import {
  classifyModelFromStore,
  invalidateModelMetadataStore,
  lookupModelMetadata,
} from "./modelMetadataStore.js";

afterEach(() => {
  invalidateModelMetadataStore();
});

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
});

describe("classifyModelFromStore", () => {
  it("classifies chat models as llm", () => {
    expect(classifyModelFromStore("openai", "gpt-4o")).toBe("llm");
  });

  it("classifies image_generation models as image", () => {
    expect(classifyModelFromStore("openai", "dall-e-3")).toBe("image");
  });

  it("returns null for embedding models (hidden)", () => {
    // text-embedding-3-small is an embedding model in the store
    expect(
      classifyModelFromStore("openai", "text-embedding-3-small"),
    ).toBeNull();
  });

  it("returns null for models not in the store", () => {
    expect(classifyModelFromStore("openai", "totally-fake-model")).toBeNull();
  });

  it("works with provider-prefixed lookups", () => {
    expect(classifyModelFromStore("xai", "grok-3")).toBe("llm");
  });

  it("returns null for audio_speech models (hidden)", () => {
    const meta = lookupModelMetadata("openai", "tts-1");
    // If tts-1 is in the store, it should be audio_speech mode → hidden
    if (meta) {
      expect(classifyModelFromStore("openai", "tts-1")).toBeNull();
    }
  });
});
