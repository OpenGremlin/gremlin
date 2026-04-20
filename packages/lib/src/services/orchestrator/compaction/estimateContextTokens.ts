import type { ModelMessage, Tool } from "ai";
import { estimateTokenCount } from "tokenx";

/**
 * Estimate the token count of a message array plus an optional system prompt
 * and optional tool definitions.
 *
 * Tool schemas contribute a non-trivial chunk on Anthropic/Bedrock — each
 * tool is serialized with its description and JSON Schema into the cached
 * prefix. Without counting them, compaction triggers later than the real
 * token count warrants.
 */
export function estimateContextTokens(
  messages: ModelMessage[],
  systemPrompt?: string,
  tools?: Record<string, Tool>,
): number {
  let total = systemPrompt ? estimateTokenCount(systemPrompt) : 0;
  for (const m of messages) {
    const text =
      typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    total += estimateTokenCount(text);
  }
  if (tools) {
    for (const [name, t] of Object.entries(tools)) {
      const schema = (t as { description?: string; inputSchema?: unknown })
        .inputSchema;
      const description = (t as { description?: string }).description ?? "";
      // Rough: tool name + description + JSON-stringified schema. Zod
      // schemas stringify poorly (functions, symbols), but length is what
      // matters here — we're approximating, not reproducing the wire format.
      total += estimateTokenCount(
        `${name} ${description} ${JSON.stringify(schema ?? {})}`,
      );
    }
  }
  return total;
}
