import { describe, expect, it } from "vitest";
import { scopeMatch } from "./scopeMatch.js";

describe("scopeMatch", () => {
  it("matches exact strings", () => {
    expect(scopeMatch(["gmail:marvin@x"], "gmail:marvin@x")).toBe(true);
    expect(scopeMatch(["gmail:marvin@x"], "gmail:other@x")).toBe(false);
  });

  it("matches trailing wildcards", () => {
    expect(scopeMatch(["gmail:*"], "gmail:marvin@x")).toBe(true);
    expect(scopeMatch(["gmail:*"], "gmail:")).toBe(true);
    expect(scopeMatch(["gmail:*"], "other:marvin@x")).toBe(false);
  });

  it("matches global wildcard", () => {
    expect(scopeMatch(["*"], "anything")).toBe(true);
  });

  it("does not match wildcards in the middle", () => {
    // `g*l:x` is not supported syntax — treated as exact-match only.
    expect(scopeMatch(["g*l:x"], "gmail:x")).toBe(false);
  });

  it("returns false on empty patterns", () => {
    expect(scopeMatch([], "anything")).toBe(false);
  });
});
