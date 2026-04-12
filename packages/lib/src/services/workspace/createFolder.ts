import * as fs from "node:fs/promises";
import { resolveWorkspacePath } from "./workspacePath.js";

export async function createFolder(folderPath: string): Promise<string> {
  const resolved = resolveWorkspacePath(folderPath);
  if (!resolved) {
    throw new Error(`Invalid path: ${folderPath}`);
  }

  await fs.mkdir(resolved, { recursive: false });
  return folderPath;
}
