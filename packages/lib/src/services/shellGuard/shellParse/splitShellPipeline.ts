import { isDoubleQuoteEscape, isEscapedAt } from "./escapes.js";

function hasUnquotedExpansionToken(line: string): boolean {
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "`" && !isEscapedAt(line, i)) return true;
    if (ch === "$" && !isEscapedAt(line, i)) {
      const next = line[i + 1];
      if (next === "(" || next === "{") return true;
    }
  }
  return false;
}

/**
 * Split a single chain part by pipe operators, respecting quotes,
 * heredocs, and detecting disallowed constructs.
 */
export function splitShellPipeline(command: string): {
  ok: boolean;
  reason?: string;
  segments: string[];
} {
  type HeredocSpec = {
    delimiter: string;
    stripTabs: boolean;
    quoted: boolean;
  };

  const parseHeredocDelimiter = (
    source: string,
    start: number,
  ): { delimiter: string; end: number; quoted: boolean } | null => {
    let i = start;
    while (i < source.length && (source[i] === " " || source[i] === "\t")) {
      i += 1;
    }
    if (i >= source.length) return null;

    const first = source[i];
    if (first === "'" || first === '"') {
      const quote = first;
      i += 1;
      let delimiter = "";
      while (i < source.length) {
        const ch = source[i];
        if (ch === "\n" || ch === "\r") return null;
        if (quote === '"' && ch === "\\" && i + 1 < source.length) {
          delimiter += source[i + 1];
          i += 2;
          continue;
        }
        if (ch === quote) {
          return { delimiter, end: i + 1, quoted: true };
        }
        delimiter += ch;
        i += 1;
      }
      return null;
    }

    let delimiter = "";
    while (i < source.length) {
      const ch = source[i];
      if (
        /\s/.test(ch) ||
        ch === "|" ||
        ch === "&" ||
        ch === ";" ||
        ch === "<" ||
        ch === ">"
      ) {
        break;
      }
      delimiter += ch;
      i += 1;
    }
    return delimiter ? { delimiter, end: i, quoted: false } : null;
  };

  const segments: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let emptySegment = false;
  const pendingHeredocs: HeredocSpec[] = [];
  let inHeredocBody = false;
  let heredocLine = "";

  const pushPart = () => {
    const trimmed = buf.trim();
    if (trimmed) segments.push(trimmed);
    buf = "";
  };

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    const next = command[i + 1];

    // Heredoc body processing
    if (inHeredocBody) {
      if (ch === "\n" || ch === "\r") {
        const current = pendingHeredocs[0];
        if (current) {
          const line = current.stripTabs
            ? heredocLine.replace(/^\t+/, "")
            : heredocLine;
          if (line === current.delimiter) {
            pendingHeredocs.shift();
          } else if (
            !current.quoted &&
            hasUnquotedExpansionToken(heredocLine)
          ) {
            return {
              ok: false,
              reason: "command substitution in unquoted heredoc",
              segments: [],
            };
          }
        }
        heredocLine = "";
        if (pendingHeredocs.length === 0) inHeredocBody = false;
        if (ch === "\r" && next === "\n") i += 1;
      } else {
        heredocLine += ch;
      }
      continue;
    }

    if (escaped) {
      buf += ch;
      escaped = false;
      emptySegment = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "\\") {
      escaped = true;
      buf += ch;
      emptySegment = false;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      buf += ch;
      emptySegment = false;
      continue;
    }
    if (inDouble) {
      if (ch === "\\" && isDoubleQuoteEscape(next)) {
        buf += ch;
        buf += next;
        i += 1;
        emptySegment = false;
        continue;
      }
      if (ch === "$" && next === "(") {
        return {
          ok: false,
          reason: "unsupported shell token: $()",
          segments: [],
        };
      }
      if (ch === "`") {
        return {
          ok: false,
          reason: "unsupported shell token: `",
          segments: [],
        };
      }
      if (ch === "\n" || ch === "\r") {
        return {
          ok: false,
          reason: "unsupported shell token: newline",
          segments: [],
        };
      }
      if (ch === '"') inDouble = false;
      buf += ch;
      emptySegment = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      emptySegment = false;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      buf += ch;
      emptySegment = false;
      continue;
    }

    // Comment
    if (ch === "#" && (i === 0 || /\s/.test(command[i - 1] ?? ""))) {
      break;
    }

    // Heredoc start
    if ((ch === "\n" || ch === "\r") && pendingHeredocs.length > 0) {
      inHeredocBody = true;
      heredocLine = "";
      if (ch === "\r" && next === "\n") i += 1;
      continue;
    }

    // Pipe operator — splits pipeline segments
    if (ch === "|" && next !== "|" && next !== "&") {
      emptySegment = true;
      pushPart();
      continue;
    }
    // ||, |&, &, ; should have been caught by splitCommandChain.
    // If they appear here, treat them as segment boundaries.
    if ((ch === "|" && (next === "|" || next === "&")) || ch === ";") {
      pushPart();
      if (next === "|" || next === "&") i += 1;
      continue;
    }
    if (ch === "&") {
      // Background operator — just treat as end of segment
      pushPart();
      continue;
    }

    // Heredoc operator <<
    if (ch === "<" && next === "<") {
      buf += "<<";
      emptySegment = false;
      i += 1;
      let scanIndex = i + 1;
      let stripTabs = false;
      if (command[scanIndex] === "-") {
        stripTabs = true;
        buf += "-";
        scanIndex += 1;
      }
      const parsed = parseHeredocDelimiter(command, scanIndex);
      if (parsed) {
        pendingHeredocs.push({
          delimiter: parsed.delimiter,
          stripTabs,
          quoted: parsed.quoted,
        });
        buf += command.slice(scanIndex, parsed.end);
        i = parsed.end - 1;
      }
      continue;
    }

    // Backticks and $() hide the real executable — reject them
    if (ch === "`") {
      return {
        ok: false,
        reason: "unsupported shell token: `",
        segments: [],
      };
    }
    if (ch === "$" && next === "(") {
      return {
        ok: false,
        reason: "unsupported shell token: $()",
        segments: [],
      };
    }

    buf += ch;
    emptySegment = false;
  }

  // Handle unterminated heredoc at EOF
  if (inHeredocBody && pendingHeredocs.length > 0) {
    const current = pendingHeredocs[0];
    const line = current.stripTabs
      ? heredocLine.replace(/^\t+/, "")
      : heredocLine;
    if (line === current.delimiter) {
      pendingHeredocs.shift();
      if (pendingHeredocs.length === 0) inHeredocBody = false;
    }
  }

  if (pendingHeredocs.length > 0 || inHeredocBody) {
    return { ok: false, reason: "unterminated heredoc", segments: [] };
  }
  if (escaped || inSingle || inDouble) {
    return {
      ok: false,
      reason: "unterminated shell quote/escape",
      segments: [],
    };
  }

  pushPart();
  if (emptySegment || segments.length === 0) {
    return {
      ok: false,
      reason:
        segments.length === 0 ? "empty command" : "empty pipeline segment",
      segments: [],
    };
  }
  return { ok: true, segments };
}
