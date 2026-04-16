/**
 * Shell command parsing — ported from OpenClaw's exec-approvals-analysis.ts
 * and shell-argv.ts. Handles quoted strings, chain operators, pipelines,
 * heredocs, command substitution detection, and wrapper unwrapping.
 */
import { parseSegment } from "./parseSegment.js";
import { splitCommandChain } from "./splitCommandChain.js";
import { splitShellPipeline } from "./splitShellPipeline.js";
import type { CommandAnalysis, CommandSegment } from "./types.js";

export { splitCommandChain } from "./splitCommandChain.js";
export { splitShellArgs } from "./splitShellArgs.js";
export type {
  ChainOperator,
  CommandAnalysis,
  CommandSegment,
} from "./types.js";

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
