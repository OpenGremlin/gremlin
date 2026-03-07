import { describe, expect, it } from "vitest";
import { buildMediaUrl } from "./index.js";

describe("buildMediaUrl", () => {
  it("constructs URL from base and path", () => {
    expect(buildMediaUrl("https://cdn.example.com", "images/photo.png")).toBe(
      "https://cdn.example.com/images/photo.png",
    );
  });

  it("handles trailing slash on cdnBase", () => {
    expect(buildMediaUrl("https://cdn.example.com/", "images/photo.png")).toBe(
      "https://cdn.example.com/images/photo.png",
    );
  });

  it("handles no trailing slash on cdnBase", () => {
    expect(buildMediaUrl("https://cdn.example.com", "images/photo.png")).toBe(
      "https://cdn.example.com/images/photo.png",
    );
  });

  it("adds width query param when provided", () => {
    expect(
      buildMediaUrl("https://cdn.example.com", "images/photo.png", 300),
    ).toBe("https://cdn.example.com/images/photo.png?width=300");
  });

  it("omits width when null", () => {
    expect(
      buildMediaUrl("https://cdn.example.com", "images/photo.png", null),
    ).toBe("https://cdn.example.com/images/photo.png");
  });

  it("omits width when undefined", () => {
    expect(
      buildMediaUrl("https://cdn.example.com", "images/photo.png", undefined),
    ).toBe("https://cdn.example.com/images/photo.png");
  });

  it("handles path with leading slash", () => {
    expect(buildMediaUrl("https://cdn.example.com", "/images/photo.png")).toBe(
      "https://cdn.example.com/images/photo.png",
    );
  });
});
