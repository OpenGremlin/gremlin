import { stripMarkdownForSpeech } from "./stripMarkdownForSpeech.js";

/**
 * Clean a completed message for TTS synthesis.
 *
 * Replaces fenced code blocks with "Here's a code block." and markdown tables
 * with "Here's a table.", then strips remaining markdown formatting via
 * {@link stripMarkdownForSpeech}.
 *
 * Unlike SentenceAccumulator (which operates on a streaming token-by-token
 * basis), this function works on complete text.
 */
export function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Replace fenced code blocks with a spoken description
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "Here's a code block.");

  // Replace markdown tables (consecutive lines starting with |) with a spoken description
  cleaned = cleaned.replace(
    /(?:^|\n)\|.+\|(?:\n\|.+\|)+/gm,
    "\nHere's a table.",
  );

  return stripMarkdownForSpeech(cleaned);
}
