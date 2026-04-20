import type { ModelMessage } from "ai";
import { formatAttachments } from "./formatAttachments.js";

/**
 * Map a non-TOOL agent log entry to a ModelMessage. TOOL entries are handled
 * separately in `buildContextMessages` so consecutive calls can be grouped
 * into proper AI SDK tool-call / tool-result content parts.
 *
 * @internal Exported for testing.
 */
export function mapEntry(node: {
  role: string;
  content: string;
  attachments?: Array<{
    type: string;
    path?: string;
    url?: string;
    title?: string;
  }>;
  internal?: boolean;
}): ModelMessage | null {
  if (node.role === "AGENT") {
    return { role: "assistant", content: node.content };
  }
  if (node.role === "USER") {
    return {
      role: "user",
      content: node.content + formatAttachments(node.attachments),
    };
  }
  if (node.role === "SYSTEM") {
    // Historical SYSTEM entries (errors, related-task context, compaction
    // summaries) render as user turns so the model sees them as part of the
    // conversation rather than competing with its real system prompt.
    return {
      role: "user",
      content: node.content + formatAttachments(node.attachments),
    };
  }
  return null;
}
