/**
 * Preset safe command lists for AI agent sandbox environments.
 *
 * These are organized by risk tier. Commands in lower tiers are always safe
 * in an isolated sandbox. Higher tiers may warrant approval in restricted modes.
 */

/** Shell builtins — not external commands, always safe. */
export const SAFE_BINS_BUILTIN = [
  "cd",
  "exit",
  "export",
  "pwd",
  "set",
  "source",
  "test",
  "true",
  "false",
  "type",
  "ulimit",
  "umask",
  "unset",
] as const;

/** Read-only inspection and text processing — always safe. */
export const SAFE_BINS_READ = [
  "awk",
  "basename",
  "cat",
  "cut",
  "date",
  "diff",
  "dirname",
  "du",
  "echo",
  "env",
  "file",
  "find",
  "grep",
  "head",
  "jq",
  "less",
  "ls",
  "printf",
  "realpath",
  "sed",
  "sort",
  "stat",
  "tail",
  "tr",
  "uniq",
  "wc",
  "which",
  "whoami",
  "xargs",
] as const;

/** Development tooling — safe in a sandbox. */
export const SAFE_BINS_DEV = [
  "bun",
  "cargo",
  "cmake",
  "esbuild",
  "git",
  "go",
  "make",
  "node",
  "npm",
  "npx",
  "pip",
  "pip3",
  "pnpm",
  "python",
  "python3",
  "rustc",
  "tsc",
  "vite",
  "yarn",
] as const;

/** Network commands — safe in a sandbox, may want approval outside one. */
export const SAFE_BINS_NETWORK = ["curl", "scp", "ssh", "wget"] as const;

/** Shell patterns that are almost always destructive or dangerous. */
export const DANGEROUS_PATTERNS = [
  "rm -rf /",
  "rm -rf /*",
  "mkfs",
  "dd if=",
  "> /dev/sd",
  ":(){ :|:& };:",
  "chmod -R 777 /",
] as const;

/** Preset configurations for common use cases. */
export const PRESETS = {
  /** Full sandbox access — approve read, dev, and network commands. */
  sandbox: [
    ...SAFE_BINS_BUILTIN,
    ...SAFE_BINS_READ,
    ...SAFE_BINS_DEV,
    ...SAFE_BINS_NETWORK,
  ],
  /** Read-only — only text processing and inspection commands. */
  restricted: [...SAFE_BINS_BUILTIN, ...SAFE_BINS_READ],
} as const;

export type PresetName = keyof typeof PRESETS;
