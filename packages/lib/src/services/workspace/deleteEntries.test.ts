import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteEntries } from "./deleteEntries.js";

const TEST_WORKSPACE = path.join(
  process.env.TMPDIR ?? "/tmp",
  "delete-entries-test",
);

describe("deleteEntries", () => {
  const original = process.env.WORKSPACE_PATH;

  beforeEach(async () => {
    process.env.WORKSPACE_PATH = TEST_WORKSPACE;
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });
  });

  afterEach(async () => {
    if (original !== undefined) {
      process.env.WORKSPACE_PATH = original;
    } else {
      delete process.env.WORKSPACE_PATH;
    }
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
  });

  it("deletes a single file", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "file.txt"), "hello");

    const result = await deleteEntries(["file.txt"]);
    expect(result.deleted).toEqual(["file.txt"]);
    expect(result.failed).toEqual([]);

    await expect(
      fs.access(path.join(TEST_WORKSPACE, "file.txt")),
    ).rejects.toThrow();
  });

  it("deletes a directory recursively", async () => {
    const dir = path.join(TEST_WORKSPACE, "subdir");
    await fs.mkdir(dir);
    await fs.writeFile(path.join(dir, "inner.txt"), "nested");

    const result = await deleteEntries(["subdir"]);
    expect(result.deleted).toEqual(["subdir"]);
    await expect(fs.access(dir)).rejects.toThrow();
  });

  it("deletes multiple entries", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "a.txt"), "a");
    await fs.writeFile(path.join(TEST_WORKSPACE, "b.txt"), "b");

    const result = await deleteEntries(["a.txt", "b.txt"]);
    expect(result.deleted).toEqual(["a.txt", "b.txt"]);
    expect(result.failed).toEqual([]);
  });

  it("reports non-existent files as failed", async () => {
    const result = await deleteEntries(["does-not-exist.txt"]);
    expect(result.deleted).toEqual([]);
    expect(result.failed).toEqual(["does-not-exist.txt"]);
  });

  it("blocks path traversal", async () => {
    const result = await deleteEntries(["../outside"]);
    expect(result.deleted).toEqual([]);
    expect(result.failed).toEqual(["../outside"]);
  });

  it("blocks deleting workspace root via empty string", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "keep.txt"), "keep");

    const result = await deleteEntries([""]);
    expect(result.deleted).toEqual([]);
    expect(result.failed).toEqual([""]);

    // Workspace root should still exist
    const stat = await fs.stat(TEST_WORKSPACE);
    expect(stat.isDirectory()).toBe(true);
  });

  it("handles mixed valid and invalid paths", async () => {
    await fs.writeFile(path.join(TEST_WORKSPACE, "valid.txt"), "ok");

    const result = await deleteEntries(["valid.txt", "../escape", "missing"]);
    expect(result.deleted).toEqual(["valid.txt"]);
    expect(result.failed).toEqual(["../escape", "missing"]);
  });
});
