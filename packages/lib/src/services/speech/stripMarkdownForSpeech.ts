/**
 * Strip markdown formatting from a sentence to produce clean text for TTS.
 *
 * This operates on individual sentences (not full documents) — structural
 * elements like code blocks and tables are handled by SentenceAccumulator
 * before text reaches this function.
 */
export function stripMarkdownForSpeech(sentence: string): string {
  let text = sentence;

  // Remove images ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Convert links [text](url) → text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers (order matters: bold first, then italic)
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  text = text.replace(/___(.+?)___/g, "$1");
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");
  text = text.replace(/~~(.+?)~~/g, "$1");

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, "");

  // Remove unordered list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");

  // Remove ordered list markers
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
