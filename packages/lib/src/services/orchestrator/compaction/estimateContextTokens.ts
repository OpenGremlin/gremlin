import type { ModelMessage } from "ai";
import { estimateTokenCount } from "tokenx";

/**
 * Estimate the token count of a message array plus an optional system prompt.
 */
export function estimateContextTokens(
  messages: ModelMessage[],
  systemPrompt?: string,
): number {
  let total = systemPrompt ? estimateTokenCount(systemPrompt) : 0;
  for (const m of messages) {
    const text =
      typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    total += estimateTokenCount(text);
  }
  return total;
}
