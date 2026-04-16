export const COMPACTION_RATIO = 0.7;

/** Fallback when model metadata has no maxInputTokens. */
export const DEFAULT_MAX_TOKENS = 200_000;

/** Threshold above which we compact synchronously before sending a prompt. */
export const PRE_PROMPT_COMPACTION_RATIO = 0.9;

/** Hard cap on how long the summarizer call may run before we abort. */
export const COMPACTION_TIMEOUT_MS = 120_000;

/**
 * Threshold (in characters) above which tool results are compacted to a
 * summary placeholder. This prevents large command outputs from consuming
 * excessive context tokens on subsequent turns.
 */
export const TOOL_RESULT_COMPACT_THRESHOLD = 2_000;
