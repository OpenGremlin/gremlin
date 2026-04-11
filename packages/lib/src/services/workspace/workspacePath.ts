import * as path from "node:path";

export function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

/**
 * Resolve a user-supplied path within the workspace, returning `null` if the
 * result would escape the workspace root or point at the root itself.
 */
export function resolveWorkspacePath(userPath: string): string | null {
  const workspacePath = getWorkspacePath();
  const resolved = path.resolve(workspacePath, userPath);
  // Block traversal outside workspace AND operations on the root itself
  if (
    !resolved.startsWith(workspacePath + path.sep) &&
    resolved !== workspacePath
  ) {
    return null;
  }
  if (resolved === workspacePath) {
    return null;
  }
  return resolved;
}
