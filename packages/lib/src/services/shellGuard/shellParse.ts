/**
 * Shell command parsing — ported from OpenClaw's exec-approvals-analysis.ts
 * and shell-argv.ts. Handles quoted strings, chain operators, pipelines,
 * heredocs, command substitution detection, and wrapper unwrapping.
 */

// ---------------------------------------------------------------------------
// Shell argv tokenization (from shell-argv.ts)
// ---------------------------------------------------------------------------

const DOUBLE_QUOTE_ESCAPES = new Set(["\\", '"', "$", "`", "\n", "\r"]);

function isDoubleQuoteEscape(next: string | undefined): next is string {
  return Boolean(next && DOUBLE_QUOTE_ESCAPES.has(next));
}

/** Parse a single shell command segment into argv, respecting quotes and escapes. */
export function splitShellArgs(raw: string): string[] | null {
  const tokens: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  const pushToken = () => {
    if (buf.length > 0) {
      tokens.push(buf);
      buf = "";
    }
  };

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "\\") {
      escaped = true;
      continue;
    }
    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        buf += ch;
      }
      continue;
    }
    if (inDouble) {
      const next = raw[i + 1];
      if (ch === "\\" && isDoubleQuoteEscape(next)) {
        buf += next;
        i += 1;
        continue;
      }
      if (ch === '"') {
        inDouble = false;
      } else {
        buf += ch;
      }
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === "#" && buf.length === 0) {
      break;
    }
    if (/\s/.test(ch)) {
      pushToken();
      continue;
    }
    buf += ch;
  }

  if (escaped || inSingle || inDouble) {
    return null;
  }
  pushToken();
  return tokens;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommandSegment = {
  /** The raw text of this pipeline segment. */
  raw: string;
  /** Parsed argv tokens. */
  argv: string[];
  /** The resolved executable name (basename, wrappers stripped). */
  executable: string | null;
};

export type CommandAnalysis = {
  ok: boolean;
  reason?: string;
  /** All segments across all chains and pipelines. */
  segments: CommandSegment[];
};

export type ChainOperator = "&&" | "||" | ";";

// ---------------------------------------------------------------------------
// Chain splitting (&&, ||, ;)
// ---------------------------------------------------------------------------

/**
 * Split a command string by chain operators while respecting quotes and escapes.
 * Returns null if no chain operators are present.
 */
export function splitCommandChain(command: string): string[] | null {
  const parts: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let foundChain = false;

  const pushPart = (): boolean => {
    const trimmed = buf.trim();
    buf = "";
    if (!trimmed) return false;
    parts.push(trimmed);
    return true;
  };

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    const next = command[i + 1];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "\\") {
      escaped = true;
      buf += ch;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      buf += ch;
      continue;
    }
    if (inDouble) {
      if (ch === "\\" && isDoubleQuoteEscape(next)) {
        buf += ch;
        buf += next;
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      buf += ch;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      buf += ch;
      continue;
    }

    // Check for comment
    if (ch === "#" && (i === 0 || /\s/.test(command[i - 1] ?? ""))) {
      break;
    }

    if (ch === "&" && next === "&") {
      if (!pushPart()) return null; // empty segment before &&
      i += 1;
      foundChain = true;
      continue;
    }
    if (ch === "|" && next === "|") {
      if (!pushPart()) return null;
      i += 1;
      foundChain = true;
      continue;
    }
    if (ch === ";") {
      if (!pushPart()) return null;
      foundChain = true;
      continue;
    }

    buf += ch;
  }

  if (!foundChain) return null;
  const trimmed = buf.trim();
  if (!trimmed) return null;
  parts.push(trimmed);
  return parts.length > 0 ? parts : null;
}

// ---------------------------------------------------------------------------
// Pipeline splitting (|)
// ---------------------------------------------------------------------------

/**
 * Split a single chain part by pipe operators, respecting quotes,
 * heredocs, and detecting disallowed constructs.
 */
function splitShellPipeline(command: string): {
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

function isEscapedAt(line: string, index: number): boolean {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && line[i] === "\\"; i -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

// ---------------------------------------------------------------------------
// Wrapper unwrapping
// ---------------------------------------------------------------------------

/** Wrappers that are transparent — the real command follows. */
const TRANSPARENT_WRAPPERS = new Set([
  "env",
  "nice",
  "nohup",
  "stdbuf",
  "timeout",
]);

/** Wrappers that escalate privilege or change execution context — always flag. */
const BLOCKED_WRAPPERS = new Set([
  "sudo",
  "doas",
  "chrt",
  "ionice",
  "setsid",
  "taskset",
]);

/**
 * Unwrap transparent wrappers (env, nice, timeout, etc.) to find the real
 * executable. Returns the executable name or null if blocked/unparseable.
 *
 * For `env`: skips VAR=val assignments and flags.
 * For `nice`: skips -n <priority> and --adjustment=<priority>.
 * For `timeout`: skips the duration argument.
 * For `nohup`, `stdbuf`: skips flags.
 */
function unwrapToExecutable(argv: string[]): {
  executable: string | null;
  blocked: boolean;
} {
  let i = 0;
  let depth = 0;
  const maxDepth = 4;

  while (i < argv.length && depth < maxDepth) {
    const token = argv[i];
    const basename = extractBasename(token);

    if (BLOCKED_WRAPPERS.has(basename)) {
      return { executable: basename, blocked: true };
    }

    if (!TRANSPARENT_WRAPPERS.has(basename)) {
      return { executable: basename, blocked: false };
    }

    depth += 1;
    i += 1;

    if (basename === "env") {
      // Skip VAR=val and flags
      while (i < argv.length) {
        const t = argv[i];
        if (t === "--") {
          i += 1;
          break;
        }
        if (t.includes("=") && !t.startsWith("-")) {
          i += 1;
          continue;
        }
        if (t.startsWith("-")) {
          i += 1;
          continue;
        }
        break;
      }
    } else if (basename === "nice") {
      while (i < argv.length && argv[i].startsWith("-")) {
        const flag = argv[i];
        i += 1;
        // -n takes a separate argument
        if ((flag === "-n" || flag === "--adjustment") && i < argv.length) {
          i += 1;
        }
      }
    } else if (basename === "timeout") {
      // Skip flags, then the duration
      while (i < argv.length && argv[i].startsWith("-")) {
        const flag = argv[i];
        i += 1;
        if (
          (flag === "-k" ||
            flag === "--kill-after" ||
            flag === "-s" ||
            flag === "--signal") &&
          i < argv.length
        ) {
          i += 1;
        }
      }
      // Next token is the duration
      if (i < argv.length) i += 1;
    } else if (basename === "nohup") {
      // nohup takes no meaningful flags, next token is the command
    } else if (basename === "stdbuf") {
      while (i < argv.length && argv[i].startsWith("-")) {
        const flag = argv[i];
        i += 1;
        if (
          (flag === "-i" || flag === "-o" || flag === "-e") &&
          i < argv.length
        ) {
          i += 1;
        }
      }
    }
  }

  return {
    executable: argv[i] ? extractBasename(argv[i]) : null,
    blocked: false,
  };
}

function extractBasename(token: string): string {
  const slash = token.lastIndexOf("/");
  return slash >= 0 ? token.slice(slash + 1) : token;
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

function parseSegment(raw: string): CommandSegment {
  const argv = splitShellArgs(raw);
  if (!argv || argv.length === 0) {
    return { raw, argv: [], executable: null };
  }
  const { executable } = unwrapToExecutable(argv);
  return { raw, argv, executable };
}

/**
 * Analyze a shell command string into its constituent segments.
 *
 * Handles:
 * - Chain operators: `&&`, `||`, `;`
 * - Pipelines: `|`
 * - Quoted strings (single and double)
 * - Heredocs (`<<`, `<<-`)
 * - Command substitution detection (`$()`, backticks) — rejected
 * - Wrapper unwrapping (env, nice, timeout, nohup, stdbuf)
 * - Blocked wrappers (sudo, doas) — flagged
 */
export function analyzeCommand(command: string): CommandAnalysis {
  const trimmed = command.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty command", segments: [] };
  }

  // First try splitting by chain operators
  const chainParts = splitCommandChain(trimmed);
  const parts = chainParts ?? [trimmed];

  const allSegments: CommandSegment[] = [];

  for (const part of parts) {
    const pipelineResult = splitShellPipeline(part);
    if (!pipelineResult.ok) {
      return {
        ok: false,
        reason: pipelineResult.reason,
        segments: [],
      };
    }
    for (const segmentRaw of pipelineResult.segments) {
      allSegments.push(parseSegment(segmentRaw));
    }
  }

  if (allSegments.length === 0) {
    return { ok: false, reason: "no segments parsed", segments: [] };
  }

  return { ok: true, segments: allSegments };
}
