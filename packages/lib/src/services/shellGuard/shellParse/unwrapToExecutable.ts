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

export function extractBasename(token: string): string {
  const slash = token.lastIndexOf("/");
  return slash >= 0 ? token.slice(slash + 1) : token;
}

/**
 * Unwrap transparent wrappers (env, nice, timeout, etc.) to find the real
 * executable. Returns the executable name or null if blocked/unparseable.
 *
 * For `env`: skips VAR=val assignments and flags.
 * For `nice`: skips -n <priority> and --adjustment=<priority>.
 * For `timeout`: skips the duration argument.
 * For `nohup`, `stdbuf`: skips flags.
 */
export function unwrapToExecutable(argv: string[]): {
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
