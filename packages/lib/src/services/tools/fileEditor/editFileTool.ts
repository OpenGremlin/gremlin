import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";
import type { FileStateTracker } from "./fileState.js";
import { resolveAndValidate } from "./pathUtils.js";

/**
 * Tool that performs exact string replacements in files, mirroring
 * the Claude Code Edit tool's interface.
 *
 * Enforces:
 * - Read-before-edit via FileStateTracker
 * - Staleness detection
 * - Multi-match detection (rejects ambiguous single replacements)
 */
export function editFileTool(
  _ctx: ServiceContext,
  tracker: FileStateTracker,
  _taskId: string | null,
) {
  return tool({
    description:
      "Perform exact string replacements in a file. You MUST read the file first with " +
      "readFile. Provide the exact text to find (old_string) and its replacement (new_string). " +
      "If old_string appears more than once, set replace_all to true or provide more " +
      "surrounding context to make the match unique.",
    inputSchema: z.object({
      file_path: z
        .string()
        .describe(
          "Absolute path to the file within the workspace (e.g. /workspace/src/index.ts)",
        ),
      old_string: z.string().describe("The exact text to find in the file"),
      new_string: z
        .string()
        .describe("The text to replace it with (must differ from old_string)"),
      replace_all: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Replace all occurrences of old_string. Default is false (first match only, but rejects if ambiguous).",
        ),
    }),
    execute: wrapExecute(
      "editFile",
      async ({ file_path, old_string, new_string, replace_all }) => {
        if (old_string === new_string) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            "old_string and new_string are identical — nothing to change.",
            "Provide a `new_string` that differs from `old_string`.",
          );
        }

        let resolved: string;
        try {
          resolved = resolveAndValidate(file_path);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return toolErr(
            ToolErrorCode.PathInvalid,
            `Path escapes the workspace: ${msg}`,
            "Use paths under /workspace/ only.",
          );
        }

        let content: string;
        try {
          content = await fs.readFile(resolved, "utf-8");
        } catch {
          return toolErr(
            ToolErrorCode.FileNotFound,
            `File not found: ${resolved}`,
            "Use `listFiles` or `glob` to find the correct path, and make sure to prefix with `/workspace/`.",
          );
        }

        try {
          tracker.validateForWrite(resolved, true);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return toolErr(
            ToolErrorCode.ProtocolViolation,
            msg,
            "Call `readFile` on this path first to see the current contents before writing.",
          );
        }

        // --- find matches ---
        const matchCount = countOccurrences(content, old_string);
        if (matchCount === 0) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            `old_string not found in ${resolved}. Make sure the text matches exactly, including whitespace and indentation.`,
            "Use `grep` or `readFile` to locate the exact text, preserving whitespace and indentation, and try again.",
          );
        }

        if (matchCount > 1 && !replace_all) {
          return toolErr(
            ToolErrorCode.InvalidInput,
            `old_string appears ${matchCount} times in ${resolved}. ` +
              "Either set replace_all to true, or include more surrounding " +
              "context in old_string to make the match unique.",
            "Use `grep` or `readFile` to find a uniquely-matching snippet, or pass `replaceAll: true`.",
          );
        }

        // --- apply replacement ---
        const updated = replace_all
          ? content.replaceAll(old_string, new_string)
          : content.replace(old_string, new_string);

        await fs.writeFile(resolved, updated, "utf-8");

        // Clear staleness so a fresh read is needed before the next edit.
        tracker.clear(resolved);

        return toolOk({
          path: resolved,
          replacements: replace_all ? matchCount : 1,
        });
      },
    ),
  });
}

/** Count non-overlapping occurrences of `search` in `text`. */
export function countOccurrences(text: string, search: string): number {
  if (search.length === 0) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = text.indexOf(search, pos);
    if (idx === -1) break;
    count++;
    pos = idx + search.length;
  }
  return count;
}
