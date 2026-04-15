import * as path from "node:path";

export function getWorkspacePath(): string {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}
