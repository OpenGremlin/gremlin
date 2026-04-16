import { describe, expect, it } from "vitest";
import { buildReasoningProviderOptions } from "./buildReasoningProviderOptions.js";

describe("buildReasoningProviderOptions", () => {
  it("returns the adaptive thinking config for Anthropic", () => {
    expect(buildReasoningProviderOptions("anthropic")).toEqual({
      anthropic: { thinking: { type: "adaptive" } },
    });
  });

  it("matches Anthropic even when the provider string is prefixed (e.g. 'anthropic-bedrock')", () => {
    expect(buildReasoningProviderOptions("anthropic-bedrock")).toEqual({
      anthropic: { thinking: { type: "adaptive" } },
    });
  });

  it("returns undefined for OpenAI (reasoning is automatic for o1/o3)", () => {
    expect(buildReasoningProviderOptions("openai")).toBeUndefined();
  });

  it("returns undefined for DeepSeek (reasoning is automatic)", () => {
    expect(buildReasoningProviderOptions("deepseek")).toBeUndefined();
  });

  it("returns undefined for unknown / unsupported providers", () => {
    expect(buildReasoningProviderOptions("mystery-provider")).toBeUndefined();
    expect(buildReasoningProviderOptions("")).toBeUndefined();
  });
});
