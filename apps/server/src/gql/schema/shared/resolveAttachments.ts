import type { Attachment } from "@gremlin/lib/services/tasks/attachment.js";

/**
 * Extract file paths from an attachments array (for the deprecated `files` resolver).
 */
export function extractFilePaths(
  attachments: Attachment[] | undefined,
): string[] {
  return (attachments ?? [])
    .filter(
      (a): a is Extract<Attachment, { type: "file" }> => a.type === "file",
    )
    .map((a) => a.path);
}
