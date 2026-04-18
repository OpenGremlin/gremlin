import { describe, expect, it } from "vitest";
import { isValidScopePattern, isValidTopic } from "./validation.js";

describe("isValidTopic", () => {
  it("accepts standard shapes", () => {
    expect(isValidTopic("gmail")).toBe(true);
    expect(isValidTopic("gmail:marvinli@gmail.com")).toBe(true);
    expect(isValidTopic("server.health.us-east-1")).toBe(true);
    expect(isValidTopic("a:b:c:d")).toBe(true);
  });

  it("rejects empty and too-long", () => {
    expect(isValidTopic("")).toBe(false);
    expect(isValidTopic("x".repeat(201))).toBe(false);
  });

  it("rejects forbidden characters", () => {
    expect(isValidTopic("gmail/admin")).toBe(false);
    expect(isValidTopic("gmail*")).toBe(false);
    expect(isValidTopic("with space")).toBe(false);
    expect(isValidTopic("with\nnewline")).toBe(false);
  });
});

describe("isValidScopePattern", () => {
  it("accepts the global wildcard", () => {
    expect(isValidScopePattern("*")).toBe(true);
  });

  it("accepts exact topics", () => {
    expect(isValidScopePattern("gmail:marvinli@gmail.com")).toBe(true);
  });

  it("accepts trailing-wildcard prefixes", () => {
    expect(isValidScopePattern("gmail:*")).toBe(true);
    expect(isValidScopePattern("server:*")).toBe(true);
  });

  it("rejects non-trailing wildcards", () => {
    expect(isValidScopePattern("g*l:x")).toBe(false);
    expect(isValidScopePattern("*:foo")).toBe(false);
  });
});
