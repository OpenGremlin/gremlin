import { describe, expect, it } from "vitest";
import { clamp, parseImageParams } from "./mediaRoute.js";

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(50, 1, 100)).toBe(50);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 1, 100)).toBe(1);
  });

  it("clamps to max", () => {
    expect(clamp(500, 1, 100)).toBe(100);
  });

  it("handles boundary values", () => {
    expect(clamp(1, 1, 100)).toBe(1);
    expect(clamp(100, 1, 100)).toBe(100);
  });
});

describe("parseImageParams", () => {
  it("returns empty params for no query", () => {
    expect(parseImageParams({})).toEqual({
      width: undefined,
      height: undefined,
      format: undefined,
    });
  });

  it("parses width", () => {
    const result = parseImageParams({ width: "200" });
    expect(result?.width).toBe(200);
  });

  it("parses height", () => {
    const result = parseImageParams({ height: "150" });
    expect(result?.height).toBe(150);
  });

  it("clamps width to 1-3000", () => {
    expect(parseImageParams({ width: "0" })?.width).toBe(1);
    expect(parseImageParams({ width: "5000" })?.width).toBe(3000);
  });

  it("clamps height to 1-3000", () => {
    expect(parseImageParams({ height: "0" })?.height).toBe(1);
    expect(parseImageParams({ height: "9999" })?.height).toBe(3000);
  });

  it("accepts valid formats", () => {
    expect(parseImageParams({ format: "webp" })?.format).toBe("webp");
    expect(parseImageParams({ format: "jpeg" })?.format).toBe("jpeg");
    expect(parseImageParams({ format: "png" })?.format).toBe("png");
    expect(parseImageParams({ format: "avif" })?.format).toBe("avif");
  });

  it("rejects invalid formats", () => {
    expect(parseImageParams({ format: "gif" })?.format).toBeUndefined();
    expect(parseImageParams({ format: "bmp" })?.format).toBeUndefined();
  });

  it("returns null for NaN width", () => {
    expect(parseImageParams({ width: "abc" })).toBeNull();
  });

  it("returns null for NaN height", () => {
    expect(parseImageParams({ height: "abc" })).toBeNull();
  });

  it("ignores non-string values", () => {
    const result = parseImageParams({ width: 200, height: true });
    expect(result?.width).toBeUndefined();
    expect(result?.height).toBeUndefined();
  });
});
