import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildWorkspaceFileUrl, verifyFileSignature } from "./buildFileUrl.js";

function parseSignedUrl(url: string) {
  const parsed = new URL(url);
  return {
    parsed,
    expires: parsed.searchParams.get("expires") ?? "",
    sig: parsed.searchParams.get("sig") ?? "",
  };
}

describe("buildWorkspaceFileUrl", () => {
  it("produces a URL with expires and sig params", () => {
    const url = buildWorkspaceFileUrl(
      "http://localhost:3001",
      "uploads/test.png",
    );
    const { parsed } = parseSignedUrl(url);
    expect(parsed.pathname).toBe("/api/files/uploads%2Ftest.png");
    expect(parsed.searchParams.has("expires")).toBe(true);
    expect(parsed.searchParams.has("sig")).toBe(true);
  });

  it("includes width param when provided", () => {
    const url = buildWorkspaceFileUrl("http://localhost:3001", "img.png", {
      width: 800,
    });
    const { parsed } = parseSignedUrl(url);
    expect(parsed.searchParams.get("width")).toBe("800");
  });

  it("omits width when null", () => {
    const url = buildWorkspaceFileUrl("http://localhost:3001", "img.png", {
      width: null,
    });
    const { parsed } = parseSignedUrl(url);
    expect(parsed.searchParams.has("width")).toBe(false);
  });
});

describe("verifyFileSignature", () => {
  it("verifies a valid signature", () => {
    const { expires, sig } = parseSignedUrl(
      buildWorkspaceFileUrl("http://localhost:3001", "test.md"),
    );
    expect(verifyFileSignature("test.md", expires, sig)).toBe(true);
  });

  it("rejects a tampered path", () => {
    const { expires, sig } = parseSignedUrl(
      buildWorkspaceFileUrl("http://localhost:3001", "test.md"),
    );
    expect(verifyFileSignature("other.md", expires, sig)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const { expires } = parseSignedUrl(
      buildWorkspaceFileUrl("http://localhost:3001", "test.md"),
    );
    expect(verifyFileSignature("test.md", expires, "badsig")).toBe(false);
  });

  it("rejects an expired URL", () => {
    const { expires, sig } = parseSignedUrl(
      buildWorkspaceFileUrl("http://localhost:3001", "test.md", {
        ttlSeconds: -1,
      }),
    );
    expect(verifyFileSignature("test.md", expires, sig)).toBe(false);
  });
});

describe("buildWorkspaceFileUrl with custom secret", () => {
  const originalEnv = process.env.FILE_URL_SECRET;

  beforeEach(() => {
    process.env.FILE_URL_SECRET = "test-secret-123";
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FILE_URL_SECRET;
    } else {
      process.env.FILE_URL_SECRET = originalEnv;
    }
  });

  it("signs with the configured secret", () => {
    const { expires, sig } = parseSignedUrl(
      buildWorkspaceFileUrl("http://localhost:3001", "file.txt"),
    );
    expect(verifyFileSignature("file.txt", expires, sig)).toBe(true);
  });
});
