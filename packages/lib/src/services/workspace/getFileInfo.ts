import * as fs from "node:fs/promises";
import * as path from "node:path";
import { mimeByExtension } from "./mime.js";

function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

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
    const ext = path.extname(resolved);
    return {
      path: filePath,
      name: path.basename(resolved),
      sizeBytes: stat.size,
      mimeType: mimeByExtension(ext),
      modifiedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}
