import * as fs from "node:fs/promises";
import { resolveWorkspacePath } from "./workspacePath.js";

export async function deleteEntries(
  paths: string[],
): Promise<{ deleted: string[]; failed: string[] }> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const p of paths) {
    const resolved = resolveWorkspacePath(p);
    if (!resolved) {
      failed.push(p);
      continue;
    }

    try {
      await fs.rm(resolved, { recursive: true });
      deleted.push(p);
    } catch {
      failed.push(p);
    }
  }

  return { deleted, failed };
}
