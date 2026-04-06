import { describe, expect, it } from "vitest";
import {
  COMMAND_TIMEOUT_MS,
  limitLines,
  MAX_OUTPUT_CHARS,
  truncate,
} from "./shared.js";

describe("constants", () => {
  it("has expected values", () => {
    expect(COMMAND_TIMEOUT_MS).toBe(20 * 60 * 1000);
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

describe("limitLines", () => {
  const input = "line1\nline2\nline3\nline4\nline5";

  it("returns input unchanged when no options set", () => {
    const result = limitLines(input, {});
    expect(result.text).toBe(input);
    expect(result.limited).toBe(false);
  });

  it("limits to first N lines with maxLines", () => {
    const result = limitLines(input, { maxLines: 2 });
    expect(result.text).toBe("line1\nline2\n... [3 more lines, 5 total]");
    expect(result.totalLines).toBe(5);
    expect(result.limited).toBe(true);
  });

  it("limits to last N lines with tail", () => {
    const result = limitLines(input, { tail: 2 });
    expect(result.text).toBe(
      "... [3 lines hidden, showing last 2]\nline4\nline5",
    );
    expect(result.totalLines).toBe(5);
    expect(result.limited).toBe(true);
  });

  it("returns unchanged when maxLines >= total lines", () => {
    const result = limitLines(input, { maxLines: 10 });
    expect(result.text).toBe(input);
    expect(result.limited).toBe(false);
  });

  it("returns unchanged when tail >= total lines", () => {
    const result = limitLines(input, { tail: 10 });
    expect(result.text).toBe(input);
    expect(result.limited).toBe(false);
  });
});
