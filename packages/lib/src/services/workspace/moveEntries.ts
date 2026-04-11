import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getWorkspacePath, resolveWorkspacePath } from "./workspacePath.js";

export async function moveEntries(
  sourcePaths: string[],
  destinationDir: string,
): Promise<{ moved: string[]; failed: string[] }> {
  const resolvedDest = resolveWorkspacePath(destinationDir);
  // Allow moving to workspace root (destinationDir === "")
  if (!resolvedDest && destinationDir !== "") {
    throw new Error("Path traversal not allowed");
  }
  const destPath = resolvedDest ?? getWorkspacePath();

  // Ensure destination exists and is a directory
  const destStat = await fs.stat(destPath);
  if (!destStat.isDirectory()) {
    throw new Error("Destination is not a directory");
  }

  const moved: string[] = [];
  const failed: string[] = [];

  for (const p of sourcePaths) {
    const resolvedSrc = resolveWorkspacePath(p);
    if (!resolvedSrc) {
      failed.push(p);
      continue;
    }

    const name = path.basename(resolvedSrc);
    const newPath = path.join(destPath, name);

    // Check for name collision
    try {
      await fs.access(newPath);
      // File/dir already exists at destination
      failed.push(p);
      continue;
    } catch {
      // Does not exist — safe to move
    }

    try {
      await fs.rename(resolvedSrc, newPath);
      moved.push(p);
    } catch {
      failed.push(p);
    }
  }

  return { moved, failed };
}
