/**
 * Transliterate markdown into natural speech text for TTS.
 *
 * Converts markdown elements into how a human would read them aloud
 * when looking at rendered markdown.
 */

const NUMBER_WORDS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

function numberToWord(n: number): string {
  return n >= 1 && n <= 20 ? (NUMBER_WORDS[n] ?? String(n)) : String(n);
}

/**
 * Clean code content for TTS — strip syntax noise, keep meaningful tokens.
 * Operates on raw code (no fence markers).
 */
export function cleanCodeForSpeech(code: string): string {
  return (
    code
      // Strip comment markers but keep the text
      .replace(/\/\/ ?/g, "")
      .replace(/\/\*|\*\//g, "")
      .replace(/^\s*# /gm, "")
      // Semicolons (statement terminators)
      .replace(/;/g, "")
      // Structural brackets
      .replace(/[{}()[\]]/g, " ")
      // Common operators → words
      .replace(/=>/g, " arrow ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Linearize a markdown table into natural speech text.
 * Reads row-by-row with header context: "Name: Alice, Age: 30."
 */
export function linearizeTable(lines: string[]): string {
  if (lines.length === 0) return "";

  const parseRow = (line: string): string[] =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

  const isSeparator = (line: string): boolean =>
    /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?\s*$/.test(line);

  const headers = parseRow(lines[0] ?? "");
  const dataRows = lines.slice(1).filter((l) => !isSeparator(l));

  if (dataRows.length === 0) return headers.join(", ");

  return dataRows
    .map((line) => {
      const cells = parseRow(line);
      return cells
        .map((cell, i) => (headers[i] ? `${headers[i]}: ${cell}` : cell))
        .join(", ");
    })
    .join(". ");
}

export function stripMarkdownForSpeech(text: string): string {
  let result = text;

  // Task lists (before unordered list stripping)
  result = result.replace(/^[\s]*[-*+]\s+\[x\]\s+(.+)/gm, "$1, done.");
  result = result.replace(/^[\s]*[-*+]\s+\[\s\]\s+(.+)/gm, "$1, not yet done.");

  // Images ![alt](url) → alt text, or remove if no alt
  result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => alt || "");

  // Links [text](url) → text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Heading markers
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Bold/italic/strikethrough — strip markers
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  result = result.replace(/___(.+?)___/g, "$1");
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/__(.+?)__/g, "$1");
  result = result.replace(/\*(.+?)\*/g, "$1");
  result = result.replace(/_(.+?)_/g, "$1");
  result = result.replace(/~~(.+?)~~/g, "$1");

  // Inline code backticks
  result = result.replace(/`([^`]+)`/g, "$1");

  // Blockquote markers
  result = result.replace(/^>\s?/gm, "");

  // Ordered list markers: 1. → "one.", 2. → "two.", etc.
  result = result.replace(/^\s*(\d+)\.\s+/gm, (_, num) => {
    const n = Number.parseInt(num, 10);
    return `${numberToWord(n)}. `;
  });

  // Unordered list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");

  // Horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, "");

  // Emojis and symbol characters
  result = result.replace(
    /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\u200d|\ufe0f/gu,
    "",
  );

  // Collapse whitespace
  result = result.replace(/\s+/g, " ").trim();

  return result;
}
