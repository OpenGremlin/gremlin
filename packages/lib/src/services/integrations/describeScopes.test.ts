import { describe, expect, it } from "vitest";
import { describeScopes } from "./describeScopes.js";

describe("describeScopes", () => {
  it("returns raw scopes joined for an unknown provider", () => {
    expect(describeScopes("unknown-provider", ["a", "b", "c"])).toBe("a, b, c");
  });

  it("returns the single label for one known scope", () => {
    expect(describeScopes("google", ["gmail.readonly"])).toBe("Read Gmail");
  });

  it('returns "X and Y" for two known scopes', () => {
    expect(describeScopes("google", ["gmail.readonly", "gmail.send"])).toBe(
      "Read Gmail and Send Gmail",
    );
  });

  it('returns "X, Y, and Z" for three known scopes', () => {
    expect(
      describeScopes("google", [
        "gmail.readonly",
        "gmail.send",
        "documents.readonly",
      ]),
    ).toBe("Read Gmail, Send Gmail, and Read Google Docs");
  });

  it("falls back to raw scopes when scopes are not in the provider", () => {
    expect(describeScopes("google", ["unknown.scope"])).toBe("unknown.scope");
  });

  it("returns empty string for empty scopes array", () => {
    expect(describeScopes("google", [])).toBe("");
  });
});
