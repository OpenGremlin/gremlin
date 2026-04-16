/** @internal Exported for testing. */
export function formatAttachments(
  attachments?: Array<{
    type: string;
    path?: string;
    url?: string;
    title?: string;
  }>,
): string {
  if (!attachments || attachments.length === 0) return "";
  const lines = attachments.map((a) => {
    if (a.type === "file") return `  - File: ${a.path}`;
    if (a.type === "link")
      return `  - Link: ${a.url}${a.title ? ` (${a.title})` : ""}`;
    return `  - ${JSON.stringify(a)}`;
  });
  return `\n\nAttached:\n${lines.join("\n")}`;
}
