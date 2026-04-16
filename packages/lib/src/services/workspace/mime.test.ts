import { describe, expect, it } from "vitest";
import {
  detectRenderKind,
  effectiveExtension,
  languageByExtension,
  mimeByExtension,
} from "./mime.js";

describe("mimeByExtension", () => {
  it("returns MIME for known extensions", () => {
    expect(mimeByExtension(".png")).toBe("image/png");
    expect(mimeByExtension(".ts")).toBe("text/typescript");
    expect(mimeByExtension(".mp3")).toBe("audio/mpeg");
  });

  it("is case-insensitive", () => {
    expect(mimeByExtension(".PNG")).toBe("image/png");
    expect(mimeByExtension(".Jpg")).toBe("image/jpeg");
  });

  it("returns null for unknown extensions", () => {
    expect(mimeByExtension(".xyz")).toBeNull();
    expect(mimeByExtension("")).toBeNull();
  });
});

describe("detectRenderKind", () => {
  it("detects document types by extension", () => {
    expect(detectRenderKind("text/markdown", ".md")).toBe("document");
    expect(detectRenderKind("text/plain", ".txt")).toBe("document");
  });

  it("detects code types by extension", () => {
    expect(detectRenderKind("text/typescript", ".ts")).toBe("code");
    expect(detectRenderKind("text/javascript", ".js")).toBe("code");
    expect(detectRenderKind("application/json", ".json")).toBe("code");
    expect(detectRenderKind("text/html", ".html")).toBe("code");
  });

  it("detects image types by MIME", () => {
    expect(detectRenderKind("image/png", ".png")).toBe("image");
    expect(detectRenderKind("image/jpeg", ".jpg")).toBe("image");
  });

  it("does not recognize HEIC/HEIF as images", () => {
    expect(detectRenderKind(null, ".heic")).toBe("unknown");
    expect(detectRenderKind(null, ".heif")).toBe("unknown");
  });

  it("detects audio types by MIME", () => {
    expect(detectRenderKind("audio/mpeg", ".mp3")).toBe("audio");
  });

  it("detects video types by MIME", () => {
    expect(detectRenderKind("video/mp4", ".mp4")).toBe("video");
  });

  it("returns unknown for unrecognized types", () => {
    expect(detectRenderKind("application/octet-stream", ".bin")).toBe(
      "unknown",
    );
    expect(detectRenderKind(null, ".xyz")).toBe("unknown");
  });

  it("prefers extension over MIME for document/code", () => {
    // .md is document even if MIME says something else
    expect(detectRenderKind("application/octet-stream", ".md")).toBe(
      "document",
    );
    expect(detectRenderKind(null, ".ts")).toBe("code");
  });
});

describe("languageByExtension", () => {
  it("returns language for known extensions", () => {
    expect(languageByExtension(".ts")).toBe("typescript");
    expect(languageByExtension(".py")).toBe("python");
    expect(languageByExtension(".rs")).toBe("rust");
  });

  it("returns plaintext for unknown extensions", () => {
    expect(languageByExtension(".xyz")).toBe("plaintext");
  });
});

describe("effectiveExtension", () => {
  it("behaves like path.extname for files with extensions", () => {
    expect(effectiveExtension("foo.ts")).toBe(".ts");
    expect(effectiveExtension("/a/b/foo.ts")).toBe(".ts");
    expect(effectiveExtension("foo.tar.gz")).toBe(".gz");
  });

  it("is case-insensitive", () => {
    expect(effectiveExtension("foo.TS")).toBe(".ts");
    expect(effectiveExtension("Dockerfile")).toBe(".dockerfile");
  });

  it("resolves well-known extensionless basenames", () => {
    expect(effectiveExtension("Dockerfile")).toBe(".dockerfile");
    expect(effectiveExtension("Makefile")).toBe(".makefile");
    expect(effectiveExtension("Rakefile")).toBe(".rb");
    expect(effectiveExtension("Gemfile")).toBe(".rb");
    expect(effectiveExtension("Jenkinsfile")).toBe(".groovy");
    expect(effectiveExtension("/path/to/Dockerfile")).toBe(".dockerfile");
  });

  it("resolves dot-prefixed basenames", () => {
    expect(effectiveExtension(".gitignore")).toBe(".gitignore");
    expect(effectiveExtension(".editorconfig")).toBe(".editorconfig");
    expect(effectiveExtension(".npmignore")).toBe(".gitignore");
  });

  it("returns empty for truly unknown extensionless files", () => {
    expect(effectiveExtension("LICENSE")).toBe("");
    expect(effectiveExtension("README")).toBe("");
  });
});
