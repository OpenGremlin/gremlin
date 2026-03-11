import { describe, expect, it } from "vitest";
import {
  HARD_TIMEOUT_MS,
  MAX_OUTPUT_CHARS,
  SOFT_TIMEOUT_MS,
  truncate,
} from "./shared.js";

describe("constants", () => {
  it("has expected values", () => {
    expect(SOFT_TIMEOUT_MS).toBe(30_000);
    expect(HARD_TIMEOUT_MS).toBe(120_000);
    expect(MAX_OUTPUT_CHARS).toBe(8_000);
  });
});

describe("truncate", () => {
  it("returns a short string unchanged", () => {
    const s = "hello world";
    expect(truncate(s)).toBe(s);
  });

  it("returns a string of exactly MAX_OUTPUT_CHARS unchanged", () => {
    const s = "x".repeat(MAX_OUTPUT_CHARS);
    expect(truncate(s)).toBe(s);
  });

  it("truncates a string over MAX_OUTPUT_CHARS with a marker in the middle", () => {
    const s = "a".repeat(MAX_OUTPUT_CHARS * 2);
    const result = truncate(s);
    expect(result).toContain("\n... [output truncated] ...\n");
    expect(result.length).toBeLessThan(s.length);
  });

  it("preserves the start and end of the original string after truncation", () => {
    const start = "S".repeat(MAX_OUTPUT_CHARS / 2);
    const middle = "M".repeat(MAX_OUTPUT_CHARS);
    const end = "E".repeat(MAX_OUTPUT_CHARS / 2);
    const s = start + middle + end;

    const result = truncate(s);

    expect(result.startsWith(start)).toBe(true);
    expect(result.endsWith(end)).toBe(true);
  });
});
