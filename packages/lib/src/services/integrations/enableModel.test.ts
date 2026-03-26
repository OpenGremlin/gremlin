import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./modelMetadataStore.js", () => ({
  classifyModelFromStore: vi.fn(),
  lookupModelMetadata: vi.fn(),
}));

import { snapshotModel } from "./enableModel.js";
import {
  classifyModelFromStore,
  lookupModelMetadata,
} from "./modelMetadataStore.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("snapshotModel", () => {
  it("adds 'image' to modalities when supports_vision is true but image is missing", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "anthropic",
      supports_vision: true,
      supported_modalities: ["text"],
    });

    const result = snapshotModel("anthropic", "claude-sonnet-4-6");
    expect(result.supportedModalities).toEqual(["text", "image"]);
  });

  it("does not duplicate 'image' when already present in modalities", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "openai",
      supports_vision: true,
      supported_modalities: ["text", "image"],
    });

    const result = snapshotModel("openai", "gpt-4o");
    expect(result.supportedModalities).toEqual(["text", "image"]);
  });

  it("adds 'image' when supports_vision is true and modalities is empty", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "bedrock",
      supports_vision: true,
      supported_modalities: [],
    });

    const result = snapshotModel("bedrock", "anthropic.claude-3-sonnet");
    expect(result.supportedModalities).toEqual(["image"]);
  });

  it("does not add 'image' when supports_vision is false", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "openai",
      supports_vision: false,
      supported_modalities: ["text"],
    });

    const result = snapshotModel("openai", "gpt-3.5-turbo");
    expect(result.supportedModalities).toEqual(["text"]);
  });

  it("defaults chat models to ['text'] when metadata has no modalities", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "openai",
    });

    const result = snapshotModel("openai", "some-model");
    expect(result.supportedModalities).toEqual(["text"]);
  });

  it("adds 'image' to default modalities when supports_vision and no modalities specified", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("chat");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "chat",
      litellm_provider: "bedrock",
      supports_vision: true,
    });

    const result = snapshotModel("bedrock", "anthropic.claude-3-haiku");
    expect(result.supportedModalities).toEqual(["text", "image"]);
  });

  it("returns undefined modalities for non-chat models without metadata", () => {
    vi.mocked(classifyModelFromStore).mockReturnValue("image_generation");
    vi.mocked(lookupModelMetadata).mockReturnValue({
      mode: "image_generation",
      litellm_provider: "openai",
    });

    const result = snapshotModel("openai", "dall-e-3");
    expect(result.supportedModalities).toBeUndefined();
  });
});
