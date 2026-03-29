import { describe, expect, it } from "vitest";
import { buildWorkspaceFileUrl } from "./buildFileUrl.js";

describe("buildWorkspaceFileUrl", () => {
  it("produces a clean URL without signing params", () => {
    const url = buildWorkspaceFileUrl(
      "http://localhost:3001",
      "uploads/test.png",
    );
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/files/uploads%2Ftest.png");
    expect(parsed.searchParams.has("expires")).toBe(false);
    expect(parsed.searchParams.has("sig")).toBe(false);
  });

  it("includes width param when provided", () => {
    const url = buildWorkspaceFileUrl("http://localhost:3001", "img.png", {
      width: 800,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("width")).toBe("800");
  });

  it("omits width when null", () => {
    const url = buildWorkspaceFileUrl("http://localhost:3001", "img.png", {
      width: null,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.has("width")).toBe(false);
  });

  it("strips trailing slash from server base", () => {
    const url = buildWorkspaceFileUrl("https://example.com/", "photo.jpg");
    expect(url).toBe("https://example.com/api/files/photo.jpg");
  });
});
