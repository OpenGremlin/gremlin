import * as path from "node:path";

/**
 * Returns the resolved workspace root from the environment.
 */
export function getWorkspacePath(): string {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

/**
 * Resolve a user-supplied path against the workspace root and validate
 * that the result does not escape the workspace boundary.
 *
 * @returns The absolute resolved path.
 * @throws If the resolved path is outside the workspace.
 */
export function resolveAndValidate(filePath: string): string {
  const workspace = getWorkspacePath();

  // The agent always uses /workspace as the canonical prefix (matching the
  // sandbox). Strip it so the path resolves against the real WORKSPACE_PATH,
  // which may differ outside the sandbox.
  if (path.isAbsolute(filePath)) {
    const canonical = "/workspace";
    if (filePath === canonical || filePath.startsWith(canonical + "/")) {
      filePath = filePath.slice(canonical.length + 1) || ".";
    }
  }

  const resolved = path.resolve(workspace, filePath);
  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}
