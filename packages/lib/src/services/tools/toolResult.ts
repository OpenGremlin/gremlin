/**
 * Unified result shape that every AI-SDK tool in this repo must return.
 *
 * Why a discriminated union (not throw, not ad-hoc `{ error }`)?
 * - The LLM sees a single, consistent JSON shape across every tool, so it can
 *   learn the error contract once and recover.
 * - We store the typed error first-class in DynamoDB, which lets the UI render
 *   `{code}: {message} {hint}` consistently (red-tinted) without parsing
 *   result-specific fields.
 * - Unexpected throws are caught by `wrapExecute` and converted to an
 *   `INTERNAL_ERROR`, so nothing ever surfaces as an unhandled tool-error
 *   content part.
 *
 * @template R The shape of the successful result payload for this tool.
 */
export type GremlinToolResult<R> =
  | { ok: true; data: R }
  | { ok: false; error: GremlinToolError };

/**
 * Structured error returned by a tool.
 *
 * @property code    Stable machine-readable code, e.g. "FILE_NOT_FOUND".
 *                   Used for UX categorization and future analytics.
 * @property message One-line human-readable summary.
 * @property hint    Optional actionable remediation hint. Tell the agent
 *                   *what to do next* — don't restate the error.
 *                   Good: "Use `listFiles` to discover the correct path."
 *                   Bad:  "The file was not found at that path."
 */
export interface GremlinToolError {
  code: string;
  message: string;
  hint?: string;
}

/**
 * Common error codes. Tools may define tool-specific codes as plain strings,
 * but should prefer these whenever a case fits.
 */
export const ToolErrorCode = {
  /** Unhandled exception — caught by `wrapExecute`. */
  InternalError: "INTERNAL_ERROR",
  /** Required configuration (API key, setting) is missing. */
  ConfigMissing: "CONFIG_MISSING",
  /** Input args passed zod validation but violate a domain rule. */
  InvalidInput: "INVALID_INPUT",
  /** Requested resource does not exist. */
  NotFound: "NOT_FOUND",
  /** Caller lacks permission / ownership. */
  Unauthorized: "UNAUTHORIZED",
  /** Path escapes the workspace sandbox. */
  PathInvalid: "PATH_INVALID",
  /** File or directory missing on disk. */
  FileNotFound: "FILE_NOT_FOUND",
  /** File exists but is the wrong kind (e.g. directory when a file was expected). */
  FileWrongType: "FILE_WRONG_TYPE",
  /** File exceeds a size limit we enforce. */
  FileTooLarge: "FILE_TOO_LARGE",
  /** Upstream HTTP call returned a non-2xx response. */
  UpstreamError: "UPSTREAM_ERROR",
  /** Request timed out waiting for an external service. */
  Timeout: "TIMEOUT",
  /** Protocol violation (e.g. write before read). */
  ProtocolViolation: "PROTOCOL_VIOLATION",
  /** Rate / quota limit hit. */
  QuotaExceeded: "QUOTA_EXCEEDED",
} as const;

export type ToolErrorCode = (typeof ToolErrorCode)[keyof typeof ToolErrorCode];

/** Construct a successful tool result. */
export function toolOk<R>(data: R): GremlinToolResult<R> {
  return { ok: true, data };
}

/** Construct a failed tool result. */
export function toolErr(
  code: string,
  message: string,
  hint?: string,
): GremlinToolResult<never> {
  return {
    ok: false,
    error: hint ? { code, message, hint } : { code, message },
  };
}

/**
 * Type guard for successful tool results. Prefer destructuring `result.ok`
 * for narrowing, but this is handy in array filters and similar contexts.
 */
export function isToolOk<R>(
  r: GremlinToolResult<R>,
): r is { ok: true; data: R } {
  return r.ok === true;
}

/**
 * Wrap a tool's execute function so any unexpected throw is converted to an
 * `INTERNAL_ERROR` result instead of surfacing as an AI-SDK `tool-error`
 * content part. The inner function must return a `GremlinToolResult<R>`
 * already — this wrapper only adds the safety net.
 *
 * Use pattern:
 *   execute: wrapExecute("readFile", async ({ path }) => {
 *     // ... return toolOk(...) or toolErr(...)
 *   }),
 *
 * The inner fn's signature matches the AI SDK's tool `execute` signature
 * `(args, options) => Promise<R>`; `options` is passed through untouched.
 */
export function wrapExecute<Args, R>(
  toolName: string,
  fn: (args: Args, options: unknown) => Promise<GremlinToolResult<R>>,
): (args: Args, options: unknown) => Promise<GremlinToolResult<R>> {
  return async (args, options) => {
    try {
      return await fn(args, options);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      // biome-ignore lint/suspicious/noConsole: observability — unexpected tool throws should always be logged
      console.error(`[tool:${toolName}] unhandled error`, err);
      return toolErr(
        ToolErrorCode.InternalError,
        `${toolName} failed: ${raw}`,
        "This is an internal error — not caused by your input. Try again once; if it keeps failing, move on and mention it in your task update.",
      );
    }
  };
}

/**
 * Extract the structured error from a raw (already-parsed) tool result JSON.
 * Returns null if the value is not a `GremlinToolResult<unknown>` error.
 * Used by the agent-log writer and the GraphQL resolver to surface typed
 * errors separately from the raw result payload.
 */
export function extractToolError(result: unknown): GremlinToolError | null {
  if (
    result &&
    typeof result === "object" &&
    "ok" in result &&
    (result as { ok: unknown }).ok === false &&
    "error" in result
  ) {
    const e = (result as { error: unknown }).error;
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      "message" in e &&
      typeof (e as { code: unknown }).code === "string" &&
      typeof (e as { message: unknown }).message === "string"
    ) {
      const hint = (e as { hint?: unknown }).hint;
      return {
        code: (e as { code: string }).code,
        message: (e as { message: string }).message,
        ...(typeof hint === "string" ? { hint } : {}),
      };
    }
  }
  return null;
}

/**
 * Unwrap the `data` payload for a successful result.
 *
 * Behavior:
 * - `{ ok: true, data }` → returns `data`.
 * - `{ ok: false, error }` → returns `null` (no success payload to read).
 * - Any other shape → returned as-is. This keeps legacy/unmigrated tool
 *   results working for downstream consumers during the rollout.
 */
export function unwrapToolData(result: unknown): unknown {
  if (
    result &&
    typeof result === "object" &&
    "ok" in result &&
    typeof (result as { ok: unknown }).ok === "boolean"
  ) {
    if ((result as { ok: boolean }).ok && "data" in result) {
      return (result as { data: unknown }).data;
    }
    return null;
  }
  return result;
}
