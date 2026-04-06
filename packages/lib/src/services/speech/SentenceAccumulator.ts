/** Common abbreviations that end with a period but don't end a sentence. */
const ABBREVIATIONS = new Set([
  "dr",
  "mr",
  "mrs",
  "ms",
  "jr",
  "sr",
  "st",
  "vs",
  "etc",
  "prof",
  "inc",
  "ltd",
  "corp",
  "dept",
  "approx",
  "est",
  "govt",
  "assn",
]);

/** Lowercase two-letter abbreviations like "i.e.", "e.g." — we check the
 *  two characters before the period. */
const TWO_LETTER_ABBREVS = new Set(["ie", "eg", "al"]);

/**
 * Stateful accumulator that receives streaming tokens and emits complete
 * sentences suitable for TTS synthesis.
 *
 * Handles markdown structures:
 * - Fenced code blocks (```) → emits "Here's a code block."
 * - Tables (lines with | separators) → emits "Here's a table."
 */
const MIN_WORDS = 5;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export class SentenceAccumulator {
  private buffer = "";
  private inCodeBlock = false;
  private tableLineCount = 0;
  /** Holds completed sentences that are too short to emit on their own. */
  private pending = "";

  /**
   * Feed a token (one or more characters) from the stream.
   * Returns an array of completed sentences (usually 0 or 1).
   */
  push(token: string): string[] {
    this.buffer += token;
    const raw = this.extract();
    return this.applyMinWords(raw);
  }

  /**
   * Flush any remaining text as a final sentence.
   * Returns null if the buffer is empty.
   */
  flush(): string | null {
    // Handle unterminated code block
    if (this.inCodeBlock) {
      this.buffer = "";
      this.inCodeBlock = false;
      return this.flushPending("Here's a code block.");
    }

    // Handle unterminated table
    if (this.tableLineCount > 0) {
      this.buffer = "";
      this.tableLineCount = 0;
      return this.flushPending("Here's a table.");
    }

    const text = this.buffer.trim();
    this.buffer = "";
    return this.flushPending(text || null);
  }

  /**
   * Merge any pending short sentences with `last` and return the combined
   * text, or null if everything is empty.
   */
  private flushPending(last: string | null): string | null {
    const combined = last
      ? `${this.pending} ${last}`.trim()
      : this.pending.trim();
    this.pending = "";
    return combined || null;
  }

  /**
   * Buffer sentences until the combined pending text reaches MIN_WORDS,
   * then emit them as a single chunk.
   */
  private applyMinWords(sentences: string[]): string[] {
    const out: string[] = [];
    for (const s of sentences) {
      this.pending = this.pending ? `${this.pending} ${s}` : s;
      if (wordCount(this.pending) >= MIN_WORDS) {
        out.push(this.pending);
        this.pending = "";
      }
    }
    return out;
  }

  private extract(): string[] {
    const sentences: string[] = [];

    // Process structural elements (code blocks, tables) line by line,
    // and sentence boundaries within normal text.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // --- Code fence detection ---
      if (this.inCodeBlock) {
        const closeIdx = this.buffer.indexOf("```");
        if (closeIdx === -1) break; // wait for closing fence
        // Discard everything up to and including the closing fence
        const afterFence = this.buffer.indexOf("\n", closeIdx + 3);
        this.buffer =
          afterFence === -1 ? "" : this.buffer.slice(afterFence + 1);
        this.inCodeBlock = false;
        sentences.push("Here's a code block.");
        continue;
      }

      // Check for opening code fence at start of a line
      const fenceMatch = this.buffer.match(/(?:^|\n)(```)/);
      if (fenceMatch && fenceMatch.index !== undefined) {
        // Emit any text before the code fence as sentences
        const before = this.buffer.slice(0, fenceMatch.index).trim();
        if (before) {
          // Put it back and extract sentences from the normal text
          const saved = this.buffer;
          this.buffer = `${before} `; // trailing space to trigger boundary
          const extracted = this.extractSentences();
          sentences.push(...extracted);
          // If anything remains, flush it
          if (this.buffer.trim()) {
            sentences.push(this.buffer.trim());
          }
          this.buffer = saved.slice(fenceMatch.index);
        }

        // Enter code block — skip past the opening fence line
        const newlineAfterFence = this.buffer.indexOf("\n", 3);
        if (newlineAfterFence === -1) {
          this.buffer = "";
        } else {
          this.buffer = this.buffer.slice(newlineAfterFence + 1);
        }
        this.inCodeBlock = true;
        continue;
      }

      // --- Table detection ---
      // A table line has at least two | characters, e.g. "| a | b |"
      const newlineIdx = this.buffer.indexOf("\n");
      if (newlineIdx !== -1) {
        const line = this.buffer.slice(0, newlineIdx);
        const trimmedLine = line.trim();

        if (this.isTableLine(trimmedLine)) {
          this.tableLineCount++;
          this.buffer = this.buffer.slice(newlineIdx + 1);
          continue;
        }

        if (this.tableLineCount > 0) {
          // Table just ended — emit announcement
          this.tableLineCount = 0;
          sentences.push("Here's a table.");
          // Don't consume the current line — it's normal text
          continue;
        }
      }

      // If we're mid-table and haven't seen a newline yet, wait for more input
      if (this.tableLineCount > 0 && newlineIdx === -1) break;

      // --- Normal sentence boundary detection ---
      const extracted = this.extractSentences();
      sentences.push(...extracted);
      break;
    }

    return sentences;
  }

  private isTableLine(line: string): boolean {
    if (!line.startsWith("|")) return false;
    // Must have at least 2 pipe characters (header row, separator, data)
    const pipeCount = (line.match(/\|/g) || []).length;
    return pipeCount >= 2;
  }

  private extractSentences(): string[] {
    const sentences: string[] = [];

    // Scan for sentence-ending punctuation followed by whitespace
    let i = 0;
    while (i < this.buffer.length) {
      const ch = this.buffer[i];

      if (ch === "." || ch === "!" || ch === "?") {
        // Need at least one character after the punctuation to confirm boundary
        if (i + 1 >= this.buffer.length) break;

        const next = this.buffer[i + 1];

        if (ch === ".") {
          // Check for ellipsis: "..." possibly followed by more dots
          // Look backward to see if this period is part of a run of dots
          if (
            (i >= 2 &&
              this.buffer[i - 1] === "." &&
              this.buffer[i - 2] === ".") ||
            (i >= 1 && this.buffer[i - 1] === "." && next === ".") ||
            (next === "." &&
              i + 2 < this.buffer.length &&
              this.buffer[i + 2] === ".")
          ) {
            i++;
            continue;
          }

          // Not a boundary if followed by non-whitespace (e.g. ".com")
          const isWhitespace =
            next === " " || next === "\n" || next === "\r" || next === "\t";
          if (!isWhitespace) {
            i++;
            continue;
          }

          // Check for decimal numbers (digit before and after period)
          if (i > 0 && /\d/.test(this.buffer[i - 1]) && /\d/.test(next)) {
            i++;
            continue;
          }

          // Check for abbreviations
          if (this.isAbbreviation(i)) {
            i++;
            continue;
          }
        } else {
          // For ! and ?, only split if followed by whitespace
          const isWhitespace =
            next === " " || next === "\n" || next === "\r" || next === "\t";
          if (!isWhitespace) {
            i++;
            continue;
          }
        }

        // Found a sentence boundary
        const sentence = this.buffer.slice(0, i + 1).trim();
        this.buffer = this.buffer.slice(i + 1).trimStart();
        if (sentence) {
          sentences.push(sentence);
        }
        i = 0;
        continue;
      }

      i++;
    }

    return sentences;
  }

  private isAbbreviation(periodIdx: number): boolean {
    // Extract the word before the period
    let start = periodIdx - 1;
    while (start >= 0 && /[a-zA-Z]/.test(this.buffer[start])) {
      start--;
    }
    start++;

    const word = this.buffer.slice(start, periodIdx).toLowerCase();
    if (!word) return false;

    // Check common abbreviations
    if (ABBREVIATIONS.has(word)) return true;

    // Check two-letter abbreviations (e.g., "e.g.", "i.e.")
    // These appear as the second letter before a period, with a period
    // two characters back: "e.g." → at periodIdx we see the final "."
    if (word.length === 1 && start >= 2 && this.buffer[start - 1] === ".") {
      const firstLetter = this.buffer[start - 2].toLowerCase();
      const combo = firstLetter + word;
      if (TWO_LETTER_ABBREVS.has(combo)) return true;
    }

    // Single uppercase letter followed by period (initials like "J.")
    if (word.length === 1 && /[A-Z]/.test(this.buffer[periodIdx - 1])) {
      return true;
    }

    return false;
  }
}
