import { describe, expect, it } from "vitest";
import { createProviderSpeechModel } from "./createProviderSpeechModel.js";

describe("createProviderSpeechModel", () => {
  it("returns a speech model for openai", () => {
    expect(createProviderSpeechModel("openai", "tts-1", "key")).toBeDefined();
  });

  it("throws for providers that don't support speech", () => {
    expect(() =>
      createProviderSpeechModel("anthropic", "claude", "key"),
    ).toThrowError(/Speech generation not supported for provider: anthropic/);
  });
});
