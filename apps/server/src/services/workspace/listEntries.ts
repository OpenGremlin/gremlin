import * as fs from "node:fs/promises";
import * as path from "node:path";

const WORKSPACE_PATH = process.env.WORKSPACE_PATH ?? "/workspace";

export interface WorkspaceEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number | null;
  modifiedAt: string | null;
}

export async function listEntries(dirPath: string): Promise<WorkspaceEntry[]> {
  const resolved = path.resolve(WORKSPACE_PATH, dirPath);
  if (!resolved.startsWith(WORKSPACE_PATH)) {
    throw new Error("Path traversal not allowed");
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });

  const results: WorkspaceEntry[] = [];
  for (const entry of entries) {
    const fullPath = path.join(resolved, entry.name);
    const relativePath = path.relative(WORKSPACE_PATH, fullPath);
    let size: number | null = null;
    let modifiedAt: string | null = null;

    try {
      const stat = await fs.stat(fullPath);
      size = entry.isDirectory() ? null : stat.size;
      modifiedAt = stat.mtime.toISOString();
    } catch {
      // skip entries we can't stat
    }

    results.push({
      name: entry.name,
      path: relativePath,
      isDirectory: entry.isDirectory(),
      size,
      modifiedAt,
    });
  }

  // Directories first, then files, alphabetical within each group
  results.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}
