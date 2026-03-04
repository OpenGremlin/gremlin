import * as fs from "node:fs/promises";
import * as path from "node:path";

function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}
const MAX_SIZE = 1024 * 1024; // 1 MB

export async function readFile(filePath: string): Promise<string | null> {
  const workspacePath = getWorkspacePath();
  const resolved = path.resolve(workspacePath, filePath);
  if (!resolved.startsWith(workspacePath)) {
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
