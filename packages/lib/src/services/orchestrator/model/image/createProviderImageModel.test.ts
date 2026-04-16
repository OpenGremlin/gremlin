import { describe, expect, it } from "vitest";
import { createProviderImageModel } from "./createProviderImageModel.js";

describe("createProviderImageModel", () => {
  it("returns an image model for each supported provider", () => {
    const providers = ["openai", "google_ai", "xai", "together", "fireworks"];
    for (const providerId of providers) {
      const model = createProviderImageModel(providerId, "img-model", "key");
      expect(model).toBeDefined();
    }
  });

  it("throws for providers that don't support image generation", () => {
    expect(() =>
      createProviderImageModel("anthropic", "claude", "key"),
    ).toThrowError(/Image generation not supported for provider: anthropic/);
  });
});
