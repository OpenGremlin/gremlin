import { describe, expect, it } from "vitest";
import { formatFileSize } from "./useFileUpload";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe("5.5 MB");
  });

  it("handles boundary at 1024", () => {
    expect(formatFileSize(1023)).toBe("1023 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("handles boundary at 1MB", () => {
    expect(formatFileSize(1024 * 1024 - 1)).toContain("KB");
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
});
