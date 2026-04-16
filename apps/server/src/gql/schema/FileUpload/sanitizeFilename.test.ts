import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "./resolvers.js";

describe("sanitizeFilename", () => {
  it("passes through simple filenames", () => {
    expect(sanitizeFilename("photo.png")).toBe("photo.png");
  });

  it("replaces forward slashes", () => {
    expect(sanitizeFilename("path/to/file.txt")).toBe("path_to_file.txt");
  });

  it("replaces backslashes", () => {
    expect(sanitizeFilename("path\\to\\file.txt")).toBe("path_to_file.txt");
  });

  it("strips null bytes", () => {
    expect(sanitizeFilename("file\0name.txt")).toBe("filename.txt");
  });

  it("truncates to 255 characters", () => {
    const long = `${"a".repeat(300)}.txt`;
    expect(sanitizeFilename(long).length).toBe(255);
  });

  it("replaces all slashes in path-only input", () => {
    expect(sanitizeFilename("///")).toBe("___");
  });

  it("handles mixed separators and null bytes", () => {
    expect(sanitizeFilename("a/b\\c\0d")).toBe("a_b_cd");
  });
});
