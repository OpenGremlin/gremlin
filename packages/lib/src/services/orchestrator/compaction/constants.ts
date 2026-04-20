export const COMPACTION_RATIO = 0.7;

/** Threshold above which we compact synchronously before sending a prompt. */
export const PRE_PROMPT_COMPACTION_RATIO = 0.9;

/**
 * Hard upper bound on effective context size, regardless of the model's
 * advertised max. Large context windows (e.g. Sonnet's 1M) degrade in
 * quality well before the limit, and linear token pricing makes very long
 * prompts uneconomical. We cap the effective budget so compaction
 * triggers at a sane size on any model.
 */
export const HARD_COMPACTION_CAP = 120_000;

/**
 * Effective input limit for compaction decisions.
 *
 *   - If the model advertises a smaller `maxInputTokens`, honor it (small
 *     models shouldn't be pushed toward their ceiling).
 *   - Otherwise, clamp to HARD_COMPACTION_CAP. This dominates the common
 *     case — 200k, 1M, etc. all collapse to the cap.
 */
export function effectiveInputLimit(maxInputTokens?: number): number {
  if (maxInputTokens == null) return HARD_COMPACTION_CAP;
  return Math.min(maxInputTokens, HARD_COMPACTION_CAP);
}

/** Hard cap on how long the summarizer call may run before we abort. */
export const COMPACTION_TIMEOUT_MS = 120_000;

/**
 * Threshold (in characters) above which tool results are compacted to a
 * summary placeholder. This prevents large command outputs from consuming
 * excessive context tokens on subsequent turns.
 */
export const TOOL_RESULT_COMPACT_THRESHOLD = 2_000;
