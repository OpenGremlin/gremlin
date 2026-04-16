import { describe, expect, it } from "vitest";
import { detectFileType } from "./detectFileType.js";

describe("detectFileType", () => {
  it("classifies JavaScript family", () => {
    expect(detectFileType(".js")).toBe("JAVASCRIPT");
    expect(detectFileType(".mjs")).toBe("JAVASCRIPT");
    expect(detectFileType(".cjs")).toBe("JAVASCRIPT");
    expect(detectFileType(".jsx")).toBe("JAVASCRIPT");
  });

  it("classifies TypeScript family", () => {
    expect(detectFileType(".ts")).toBe("TYPESCRIPT");
    expect(detectFileType(".tsx")).toBe("TYPESCRIPT");
  });

  it("collapses JVM languages under JAVA", () => {
    expect(detectFileType(".java")).toBe("JAVA");
    expect(detectFileType(".kt")).toBe("JAVA");
    expect(detectFileType(".scala")).toBe("JAVA");
  });

  it("routes mobile-ish languages to SWIFT", () => {
    expect(detectFileType(".swift")).toBe("SWIFT");
    expect(detectFileType(".dart")).toBe("SWIFT");
  });

  it("routes config-ish files to CONFIG", () => {
    expect(detectFileType(".json")).toBe("CONFIG");
    expect(detectFileType(".yaml")).toBe("CONFIG");
    expect(detectFileType(".toml")).toBe("CONFIG");
    expect(detectFileType(".dockerfile")).toBe("CONFIG");
    expect(detectFileType(".gitignore")).toBe("CONFIG");
  });

  it("routes web-related files to WEB", () => {
    expect(detectFileType(".html")).toBe("WEB");
    expect(detectFileType(".css")).toBe("WEB");
    expect(detectFileType(".vue")).toBe("WEB");
    expect(detectFileType(".astro")).toBe("WEB");
  });

  it("routes docs to DOCUMENT", () => {
    expect(detectFileType(".md")).toBe("DOCUMENT");
    expect(detectFileType(".mdx")).toBe("DOCUMENT");
    expect(detectFileType(".txt")).toBe("DOCUMENT");
    expect(detectFileType(".docx")).toBe("DOCUMENT");
  });

  it("routes PDF to PDF", () => {
    expect(detectFileType(".pdf")).toBe("PDF");
  });

  it("routes images / audio / video", () => {
    expect(detectFileType(".png")).toBe("IMAGE");
    expect(detectFileType(".jpg")).toBe("IMAGE");
    expect(detectFileType(".mp3")).toBe("AUDIO");
    expect(detectFileType(".mp4")).toBe("VIDEO");
  });

  it("routes archives", () => {
    expect(detectFileType(".zip")).toBe("ARCHIVE");
    expect(detectFileType(".tar")).toBe("ARCHIVE");
    expect(detectFileType(".7z")).toBe("ARCHIVE");
  });

  it("falls back to CODE_OTHER for non-priority languages", () => {
    expect(detectFileType(".rb")).toBe("CODE_OTHER");
    expect(detectFileType(".php")).toBe("CODE_OTHER");
    expect(detectFileType(".cpp")).toBe("CODE_OTHER");
    expect(detectFileType(".diff")).toBe("CODE_OTHER");
  });

  it("falls back to UNKNOWN for unrecognised extensions", () => {
    expect(detectFileType(".xyz")).toBe("UNKNOWN");
    expect(detectFileType("")).toBe("UNKNOWN");
  });

  it("is case-insensitive", () => {
    expect(detectFileType(".PNG")).toBe("IMAGE");
    expect(detectFileType(".TS")).toBe("TYPESCRIPT");
  });
});
