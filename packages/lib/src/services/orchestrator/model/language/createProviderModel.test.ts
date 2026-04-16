import { describe, expect, it } from "vitest";
import { createProviderModel } from "./createProviderModel.js";

describe("createProviderModel", () => {
  it("returns a model for each supported provider", () => {
    const providers = [
      "anthropic",
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
    ];

    for (const providerId of providers) {
      const model = createProviderModel(providerId, "some-model", "test-key");
      // Each provider returns *something* — exact shape varies by SDK.
      // We only assert that a non-null value comes back, so the switch
      // is exhaustively wired and no case falls through.
      expect(model).toBeDefined();
    }
  });

  it("throws for an unknown provider", () => {
    expect(() =>
      createProviderModel("mystery-provider", "x", "y"),
    ).toThrowError(/Unknown provider: mystery-provider/);
  });
});
