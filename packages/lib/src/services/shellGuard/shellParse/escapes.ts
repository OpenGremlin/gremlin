/**
 * Characters that can follow a backslash inside double quotes and still
 * count as an escape. Shared between the argv tokenizer, the chain
 * splitter and the pipeline splitter — all three need the exact same
 * set of rules to stay consistent.
 */
const DOUBLE_QUOTE_ESCAPES = new Set(["\\", '"', "$", "`", "\n", "\r"]);

export function isDoubleQuoteEscape(next: string | undefined): next is string {
  return Boolean(next && DOUBLE_QUOTE_ESCAPES.has(next));
}

/**
 * Whether the character at `index` is escaped by an odd-length run of
 * backslashes preceding it. Used by heredoc body scanning to tell
 * `$()` from `\$()`.
 */
export function isEscapedAt(line: string, index: number): boolean {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && line[i] === "\\"; i -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}
