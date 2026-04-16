import type { ModelMessage } from "ai";
import { compactToolResult } from "./compactToolResult.js";
import { formatAttachments } from "./formatAttachments.js";

/** @internal Exported for testing. */
export function mapEntry(node: {
  role: string;
  content: string;
  toolName?: string | null;
  toolInput?: string | null;
  toolResult?: string | null;
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
    return {
      role: "user",
      content: node.content + formatAttachments(node.attachments),
    };
  }
  if (node.role === "TOOL" && !node.internal) {
    // Include tool calls as system context so the model knows what it already did.
    // Using "user" role to avoid the model mimicking the format in its own output.
    const name = node.toolName ?? "unknown";
    const input = node.toolInput ?? "";
    const result =
      node.toolResult && node.toolResult !== "null" ? node.toolResult : null;
    if (result) {
      const compacted = compactToolResult(name, result);
      return {
        role: "user",
        content: `[System: you called ${name} with ${input} and got: ${compacted ?? result}]`,
      };
    }
    // Call-only entry (no result yet) — skip
    return null;
  }
  return null;
}
