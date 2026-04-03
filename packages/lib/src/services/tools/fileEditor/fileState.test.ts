import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateTracker } from "./fileState.js";

describe("FileStateTracker", () => {
  let tracker: FileStateTracker;
  let tmpDir: string;

  beforeEach(async () => {
    tracker = new FileStateTracker();
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "filestate-test-"));
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  function tmpFile(name: string, content: string): string {
    const p = path.join(tmpDir, name);
    fs.writeFileSync(p, content);
    return p;
  }

  describe("validateForWrite", () => {
    it("allows writing a new file without prior read", () => {
      const p = path.join(tmpDir, "new.txt");
      expect(() => tracker.validateForWrite(p, false)).not.toThrow();
    });

    it("rejects writing an existing file without prior read", () => {
      const p = tmpFile("existing.txt", "hello");
      expect(() => tracker.validateForWrite(p, true)).toThrow(
        "File has not been read yet",
      );
    });

    it("allows writing after a full read", () => {
      const p = tmpFile("file.txt", "content");
      tracker.recordRead(p, "content", false);
      expect(() => tracker.validateForWrite(p, true)).not.toThrow();
    });

    it("rejects writing after a partial read", () => {
      const p = tmpFile("file.txt", "content");
      tracker.recordRead(p, "content", true);
      expect(() => tracker.validateForWrite(p, true)).toThrow(
        "only partially read",
      );
    });

    it("rejects writing if file was modified since read", async () => {
      const p = tmpFile("file.txt", "original");
      tracker.recordRead(p, "original", false);

      // Wait a bit and modify the file to ensure mtime changes
      await new Promise((r) => setTimeout(r, 50));
      fs.writeFileSync(p, "modified");

      expect(() => tracker.validateForWrite(p, true)).toThrow(
        "modified since it was last read",
      );
    });
  });

  describe("clear", () => {
    it("forces a fresh read after clear", () => {
      const p = tmpFile("file.txt", "content");
      tracker.recordRead(p, "content", false);
      tracker.clear(p);
      expect(() => tracker.validateForWrite(p, true)).toThrow(
        "has not been read yet",
      );
    });
  });
});
