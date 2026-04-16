import * as fs from "node:fs/promises";
import * as path from "node:path";
import { effectiveExtension, mimeByExtension } from "./mime/index.js";
import { getWorkspacePath } from "./workspacePath.js";

export interface FileInfo {
  path: string;
  name: string;
  sizeBytes: number;
  mimeType: string | null;
  modifiedAt: string;
}

export async function getFileInfo(filePath: string): Promise<FileInfo | null> {
  const workspacePath = getWorkspacePath();
  const resolved = path.resolve(workspacePath, filePath);
  if (!resolved.startsWith(workspacePath)) {
    throw new Error("Path traversal not allowed");
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return null;
    const name = path.basename(resolved);
    return {
      path: filePath,
      name,
      sizeBytes: stat.size,
      mimeType: mimeByExtension(effectiveExtension(name)),
      modifiedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}
