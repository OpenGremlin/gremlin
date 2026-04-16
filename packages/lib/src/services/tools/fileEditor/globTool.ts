import { tool } from "ai";
import fg from "fast-glob";
import { z } from "zod";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";
import { getWorkspacePath, resolveAndValidate } from "./pathUtils.js";

const MAX_RESULTS = 200;

/**
 * Tool that finds files by glob pattern within the workspace.
 * Gives agents file discovery without shelling out to `find` or `ls`.
 */
export function globTool() {
  return tool({
    description:
      "Find files by name pattern using glob syntax. Returns matching file paths " +
      "sorted by modification time (newest first). Use this to discover files before " +
      "reading or editing them.\n\n" +
      "Common patterns:\n" +
      '- "**/*.ts" — all TypeScript files\n' +
      '- "src/**/*.test.ts" — test files under src/\n' +
      '- "*.json" — JSON files in a directory\n' +
      '- "**/{package,tsconfig}.json" — specific filenames anywhere',
    inputSchema: z.object({
      pattern: z.string().describe("Glob pattern to match files against"),
      path: z
        .string()
        .optional()
        .describe(
          "Absolute directory path within the workspace (e.g. /workspace/src). Omit for workspace root.",
        ),
    }),
    execute: wrapExecute("glob", async ({ pattern, path: searchPath }) => {
      let cwd: string;
      try {
        cwd = searchPath ? resolveAndValidate(searchPath) : getWorkspacePath();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolErr(
          ToolErrorCode.PathInvalid,
          `Path escapes the workspace: ${msg}`,
          "Use paths under /workspace/ only.",
        );
      }

      const workspace = getWorkspacePath();

      let files: string[];
      try {
        files = await fg(pattern, {
          cwd,
          dot: false,
          onlyFiles: true,
          absolute: true,
          suppressErrors: true,
          followSymbolicLinks: false,
        });
      } catch {
        return toolErr(
          ToolErrorCode.InvalidInput,
          `Invalid glob pattern: ${pattern}`,
          "Use forward-slash patterns like `src/**/*.ts`.",
        );
      }

      // Filter to workspace boundary (safety net).
      files = files.filter(
        (f) => f.startsWith(`${workspace}/`) || f === workspace,
      );

      // Sort by modification time, newest first.
      const withStats = await Promise.all(
        files.map(async (f) => {
          try {
            const { mtimeMs } = await import("node:fs/promises").then((fs) =>
              fs.stat(f),
            );
            return { file: f, mtime: mtimeMs };
          } catch {
            return { file: f, mtime: 0 };
          }
        }),
      );
      withStats.sort((a, b) => b.mtime - a.mtime);

      const truncated = withStats.length > MAX_RESULTS;
      const results = withStats.slice(0, MAX_RESULTS);

      return toolOk({
        numFiles: results.length,
        files: results.map((r) => r.file),
        ...(truncated
          ? {
              truncated: true,
              total: withStats.length,
              hint: "Results truncated. Use a more specific pattern or path.",
            }
          : {}),
      });
    }),
  });
}
