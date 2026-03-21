import { createLogger } from "../../logger.js";
import { DANGEROUS_PATTERNS, PRESETS, type PresetName } from "./presets.js";
import { analyzeCommand } from "./shellParse.js";
import type { AllowlistEntry, AllowlistProvider } from "./types.js";

const log = createLogger("shellGuard");

/** Check whether a command matches any dangerous pattern. */
function matchesDangerousPattern(command: string): string | null {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (command.includes(pattern)) return pattern;
  }
  return null;
}

/** Check whether an executable matches an allowlist entry's glob pattern. */
function matchesAllowlist(
  executable: string,
  entries: AllowlistEntry[],
): boolean {
  const lower = executable.toLowerCase();
  return entries.some((entry) => {
    const pattern = entry.pattern.toLowerCase();
    if (pattern === lower) return true;
    if (pattern.endsWith("*")) {
      return lower.startsWith(pattern.slice(0, -1));
    }
    return false;
  });
}

export interface GuardCommandParams {
  command: string;
  agentId: string;
  taskId: string;
  allowlistProvider: AllowlistProvider;
  /** Preset to use. Defaults to "sandbox". */
  preset?: PresetName;
  /** Additional safe executables beyond the preset. */
  additionalSafeBins?: string[];
  /** Fully override the safe set (ignores preset). */
  safeBins?: string[];
}

/** Result of evaluating a command against the guard policy. */
export type GuardVerdict =
  | { needsApproval: false }
  | { needsApproval: true; reason: string };

/**
 * Evaluate a shell command against the guard policy.
 * Returns whether the command needs human approval and why.
 *
 * This is a pure evaluation — it does NOT create approval entities
 * or block on user input. The caller handles the approval lifecycle.
 */
export async function guardCommand(
  params: GuardCommandParams,
): Promise<GuardVerdict> {
  const { command, agentId, taskId, allowlistProvider } = params;

  // Build the safe set
  const safeBinList = params.safeBins ?? [
    ...PRESETS[params.preset ?? "sandbox"],
    ...(params.additionalSafeBins ?? []),
  ];
  const safeBins = new Set(safeBinList.map((b) => b.toLowerCase()));

  // 1. Check for dangerous patterns
  const dangerousMatch = matchesDangerousPattern(command);
  if (dangerousMatch) {
    log.warn(
      { agentId, taskId, command: command.slice(0, 200), dangerousMatch },
      "Command matches dangerous pattern",
    );
    return {
      needsApproval: true,
      reason: `Matches dangerous pattern: "${dangerousMatch}"`,
    };
  }

  // 2. Parse the command into segments
  const analysis = analyzeCommand(command);
  if (!analysis.ok) {
    log.info(
      {
        agentId,
        taskId,
        reason: analysis.reason,
        command: command.slice(0, 200),
      },
      "Command unparseable — requires approval",
    );
    return {
      needsApproval: true,
      reason: `Unable to parse command: ${analysis.reason}`,
    };
  }

  // 3. Check each segment's executable against safe bins and allowlist
  const entries = await allowlistProvider.getEntries(agentId);
  const unsafeExecutables: string[] = [];

  for (const segment of analysis.segments) {
    if (!segment.executable) {
      unsafeExecutables.push(segment.raw.slice(0, 60));
      continue;
    }

    const lower = segment.executable.toLowerCase();
    const isSafe = safeBins.has(lower);
    const isAllowed = matchesAllowlist(segment.executable, entries);

    if (!isSafe && !isAllowed) {
      unsafeExecutables.push(segment.executable);
    }
  }

  if (unsafeExecutables.length === 0) {
    return { needsApproval: false };
  }

  log.info(
    { agentId, taskId, unsafeExecutables, command: command.slice(0, 200) },
    "Command requires approval",
  );

  return {
    needsApproval: true,
    reason: `Unknown executable(s): ${unsafeExecutables.join(", ")}`,
  };
}
