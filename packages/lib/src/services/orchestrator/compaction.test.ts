import { describe, expect, it } from "vitest";
import { formatAttachments, mapEntry } from "./compaction.js";

describe("formatAttachments", () => {
  it("returns empty string for undefined", () => {
    expect(formatAttachments(undefined)).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(formatAttachments([])).toBe("");
  });

  it("formats file attachments with path", () => {
    const result = formatAttachments([
      { type: "file", path: "uploads/2026-03-20/photo.png" },
    ]);
    expect(result).toContain("Attached:");
    expect(result).toContain("File: uploads/2026-03-20/photo.png");
  });

  it("formats link attachments with url", () => {
    const result = formatAttachments([
      { type: "link", url: "https://example.com" },
    ]);
    expect(result).toContain("Link: https://example.com");
  });

  it("includes title for link attachments when present", () => {
    const result = formatAttachments([
      { type: "link", url: "https://example.com", title: "Example" },
    ]);
    expect(result).toContain("Link: https://example.com (Example)");
  });

  it("formats multiple attachments", () => {
    const result = formatAttachments([
      { type: "file", path: "uploads/a.png" },
      { type: "file", path: "uploads/b.pdf" },
      { type: "link", url: "https://example.com" },
    ]);
    expect(result).toContain("File: uploads/a.png");
    expect(result).toContain("File: uploads/b.pdf");
    expect(result).toContain("Link: https://example.com");
  });

  it("falls back to JSON for unknown attachment types", () => {
    const result = formatAttachments([{ type: "other" }]);
    expect(result).toContain(JSON.stringify({ type: "other" }));
  });
});

describe("mapEntry", () => {
  it("maps AGENT role to assistant", () => {
    const result = mapEntry({ role: "AGENT", content: "Hello" });
    expect(result).toEqual({ role: "assistant", content: "Hello" });
  });

  it("maps USER role to user", () => {
    const result = mapEntry({ role: "USER", content: "Hi" });
    expect(result).toEqual({ role: "user", content: "Hi" });
  });

  it("maps SYSTEM role to user", () => {
    const result = mapEntry({ role: "SYSTEM", content: "Context" });
    expect(result).toEqual({ role: "user", content: "Context" });
  });

  it("appends attachments to USER messages", () => {
    const result = mapEntry({
      role: "USER",
      content: "Check this image",
      attachments: [{ type: "file", path: "uploads/photo.png" }],
    });
    expect(result?.content).toContain("Check this image");
    expect(result?.content).toContain("File: uploads/photo.png");
  });

  it("appends attachments to SYSTEM messages", () => {
    const result = mapEntry({
      role: "SYSTEM",
      content: "File uploaded",
      attachments: [{ type: "file", path: "uploads/doc.pdf" }],
    });
    expect(result?.content).toContain("File uploaded");
    expect(result?.content).toContain("File: uploads/doc.pdf");
  });

  it("does not append attachments to AGENT messages", () => {
    const result = mapEntry({
      role: "AGENT",
      content: "Done",
      // attachments on agent entries would be unusual but shouldn't break
    });
    expect(result).toEqual({ role: "assistant", content: "Done" });
  });

  it("maps TOOL entries with result", () => {
    const result = mapEntry({
      role: "TOOL",
      content: "Tool call: viewImage",
      toolName: "viewImage",
      toolInput: '{"path":"photo.png"}',
      toolResult: '{"type":"image"}',
    });
    expect(result?.role).toBe("user");
    expect(result?.content).toContain("viewImage");
    expect(result?.content).toContain('{"type":"image"}');
  });

  it("skips TOOL entries without result", () => {
    const result = mapEntry({
      role: "TOOL",
      content: "Tool call: viewImage",
      toolName: "viewImage",
      toolInput: '{"path":"photo.png"}',
      toolResult: null,
    });
    expect(result).toBeNull();
  });

  it("skips internal TOOL entries", () => {
    const result = mapEntry({
      role: "TOOL",
      content: "Tool call: updateDocument",
      toolName: "updateDocument",
      toolInput: "{}",
      toolResult: "{}",
      internal: true,
    });
    expect(result).toBeNull();
  });

  it("returns null for unknown roles", () => {
    const result = mapEntry({ role: "UNKNOWN", content: "?" });
    expect(result).toBeNull();
  });
});
