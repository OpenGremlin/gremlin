import * as fs from "node:fs/promises";
import * as path from "node:path";

const WORKSPACE_PATH = process.env.WORKSPACE_PATH ?? "/workspace";
const MAX_SIZE = 1024 * 1024; // 1 MB

export async function readFile(filePath: string): Promise<string | null> {
  const resolved = path.resolve(WORKSPACE_PATH, filePath);
  if (!resolved.startsWith(WORKSPACE_PATH)) {
    throw new Error("Path traversal not allowed");
  }

  const stat = await fs.stat(resolved);
  if (stat.size > MAX_SIZE) return null;

  const buf = await fs.readFile(resolved);

  // Reject binary files (check for null bytes in first 8KB)
  const sample = buf.subarray(0, 8192);
  if (sample.includes(0)) return null;

  return buf.toString("utf-8");
}
