import * as fs from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
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
export function editFileTool(_ctx: ServiceContext, tracker: FileStateTracker) {
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
          "Path to the file (relative to workspace root, or absolute within workspace)",
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
    execute: async ({ file_path, old_string, new_string, replace_all }) => {
      // Validation uses two error strategies:
      //  - throw: protocol violations (path traversal, unread file, stale file)
      //    — these become tool-call errors the model must fix before retrying.
      //  - return { error }: content-level issues (no match, ambiguous match, no-op)
      //    — these are normal results the model can react to conversationally.

      if (old_string === new_string) {
        return {
          error: "old_string and new_string are identical — nothing to change.",
        };
      }

      const resolved = resolveAndValidate(file_path);

      let content: string;
      try {
        content = await fs.readFile(resolved, "utf-8");
      } catch {
        return { error: `File not found: ${file_path}` };
      }

      tracker.validateForWrite(resolved, true);

      // --- find matches ---
      const matchCount = countOccurrences(content, old_string);
      if (matchCount === 0) {
        return {
          error: `old_string not found in ${file_path}. Make sure the text matches exactly, including whitespace and indentation.`,
        };
      }

      if (matchCount > 1 && !replace_all) {
        return {
          error:
            `old_string appears ${matchCount} times in ${file_path}. ` +
            "Either set replace_all to true, or include more surrounding " +
            "context in old_string to make the match unique.",
        };
      }

      // --- apply replacement ---
      const updated = replace_all
        ? content.replaceAll(old_string, new_string)
        : content.replace(old_string, new_string);

      await fs.writeFile(resolved, updated, "utf-8");

      // Clear staleness so a fresh read is needed before the next edit.
      tracker.clear(resolved);

      return {
        file_path,
        replacements: replace_all ? matchCount : 1,
      };
    },
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
