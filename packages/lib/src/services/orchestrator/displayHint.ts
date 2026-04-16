import { ToolName } from "../../enums.js";
import { extractToolError, unwrapToolData } from "../tools/toolResult.js";

export type DisplayHint = {
  text: string;
  variant?: "success" | "error" | "warning";
  /** Short error message extracted from the tool result, if present. */
  error?: string;
};

/**
 * Compute a short, human-readable display hint for a tool call.
 * Returns `null` for tools that should not render a status line
 * (e.g. hidden internal tools, or tools with custom UI widgets).
 *
 * The backend owns the message text and semantic variant;
 * the frontend owns the icon.
 *
 * Tool results may be either a structured `GremlinToolResult<R>` (the current
 * contract) or an unwrapped legacy shape (older log entries predate the
 * unification). Both paths are tolerated.
 */
export function computeDisplayHint(
  toolName: string,
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
): DisplayHint | null {
  // Unwrap structured result so tool-specific field lookups (title, path, etc.)
  // work the same whether the raw value is `{ ok, data }` or a legacy payload.
  const payload = toolResultPayload(result);
  const hint = computeDisplayHintInner(toolName, input, payload);
  if (!hint) return null;

  const error = extractDisplayError(result);
  if (error) {
    return { ...hint, error, variant: "error" };
  }
  return hint;
}

/**
 * Normalise the success payload we pass into field-lookup logic.
 * - `{ ok: true, data }` → `data`
 * - `{ ok: false, error }` → `null` (errors handled separately)
 * - legacy unwrapped object → returned as-is
 */
function toolResultPayload(
  result: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!result) return null;
  if (typeof result.ok === "boolean") {
    if (result.ok === true) {
      const data = unwrapToolData(result);
      return data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : null;
    }
    return null;
  }
  return result;
}

/**
 * Produce the one-line error summary rendered under a failed tool status.
 * Prefers the typed `GremlinToolError` shape, falls back to common legacy
 * patterns so historical log entries still render sensibly.
 */
function extractDisplayError(
  result: Record<string, unknown> | null,
): string | undefined {
  if (!result) return undefined;
  const typed = extractToolError(result);
  if (typed) {
    return typed.hint
      ? `${typed.code}: ${typed.message} ${typed.hint}`
      : `${typed.code}: ${typed.message}`;
  }
  // Legacy shapes from pre-GremlinToolResult log entries.
  if (typeof result.error === "string") return result.error;
  if (result.type === "error" && typeof result.message === "string") {
    return result.message;
  }
  return undefined;
}

function computeDisplayHintInner(
  toolName: string,
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
): DisplayHint | null {
  // Native task tracking tools
  // Prefer the task title from the result (which contains the full task object)
  // over the raw ID from the input.
  const taskTitle =
    (result?.title as string) ??
    ((result?.task as Record<string, unknown>)?.title as string) ??
    (input?.title as string) ??
    (input?.taskId as string) ??
    "task";

  if (toolName === "taskCreate") {
    return { text: `Creating task: ${(input?.title as string) ?? "task"}` };
  }
  if (toolName === "taskShow") {
    return { text: `Viewing task: ${taskTitle}` };
  }
  if (toolName === "taskUpdate") {
    const parts = [taskTitle];
    if (input?.status) parts.push(`→ ${input.status}`);
    if (input?.status === "closed") {
      return { text: `Closing task: ${parts.join(" ")}`, variant: "success" };
    }
    return { text: `Updating task: ${parts.join(" ")}` };
  }
  // Legacy display hints — taskClose and taskReopen are now handled by
  // taskUpdate with status: "closed" / "open", but old log entries may
  // still reference these tool names.
  if (toolName === "taskClose") {
    return {
      text: `Closing task: ${taskTitle}`,
      variant: "success",
    };
  }
  if (toolName === "taskReopen") {
    return { text: `Reopening task: ${taskTitle}` };
  }
  if (toolName === "taskList") {
    return { text: "Listing tasks" };
  }
  if (toolName === "taskReady") {
    return { text: "Checking ready work" };
  }
  if (toolName === "taskDep") {
    return {
      text: `${(input?.action as string) === "remove" ? "Removing" : "Adding"} dependency`,
    };
  }
  if (toolName === "taskDepTree") {
    return { text: `Viewing dependency tree: ${taskTitle}` };
  }
  if (toolName === "taskBlocked") {
    return { text: "Checking blocked tasks" };
  }

  switch (toolName) {
    // ── File editor ────────────────────────────────────────────────
    case ToolName.ReadFile:
      return {
        text: `Reading file: ${(input?.file_path as string) ?? "unknown"}`,
      };
    case ToolName.WriteFile:
      return {
        text: `Writing file: ${(result?.path as string) ?? (input?.file_path as string) ?? "unknown"}`,
      };
    case ToolName.EditFile:
      return {
        text: `Editing file: ${(result?.path as string) ?? (input?.file_path as string) ?? "unknown"}`,
      };
    case ToolName.ListFiles:
      return { text: `Listing files: ${(input?.path as string) ?? "."}` };
    case ToolName.Glob:
      return {
        text: `Searching files: ${(input?.pattern as string) ?? "unknown"}`,
      };
    case ToolName.Grep:
      return {
        text: `Searching for: ${(input?.pattern as string) ?? "unknown"}`,
      };

    // ── Attachments ────────────────────────────────────────────────
    case ToolName.AttachFile:
      return {
        text: `Attaching file: ${(input?.path as string) ?? "unknown"}`,
      };
    case ToolName.AttachLink:
      return {
        text: `Attaching link: ${(input?.title as string) ?? (input?.url as string) ?? "unknown"}`,
      };

    // ── Sandbox ────────────────────────────────────────────────────
    case ToolName.EnsureSandbox: {
      const status = result?.status as string | undefined;
      if (status === "ready")
        return { text: "Preparing sandbox", variant: "success" };
      return { text: "Connecting to sandbox", variant: "warning" };
    }

    // ── Media ──────────────────────────────────────────────────────
    case ToolName.ViewImage:
      return {
        text: `Viewing image: ${(input?.path as string) ?? "unknown"}`,
      };
    case ToolName.GenerateImage:
      return {
        text: `Generating image: ${(result?.path as string) ?? (input?.outputPath as string) ?? "unknown"}`,
      };
    case ToolName.GenerateSpeech:
      return {
        text: `Generating audio: ${(result?.path as string) ?? (input?.outputPath as string) ?? "unknown"}`,
      };

    // ── Web ────────────────────────────────────────────────────────
    case ToolName.WebSearch:
      return { text: `Searching: ${(input?.query as string) ?? "unknown"}` };
    case ToolName.WebFetch:
      return { text: `Fetching: ${(input?.url as string) ?? "unknown"}` };

    // ── Skills ─────────────────────────────────────────────────────
    case ToolName.ReadSkill:
      return {
        text: `Reading skill: ${(input?.skillId as string) ?? "skill"}`,
      };
    case ToolName.ReadSkillReference:
      return {
        text: `Reading reference: ${(input?.reference as string) ?? "unknown"}`,
      };
    case ToolName.Authenticate: {
      const skillId = (input?.skillId as string) ?? "skill";
      const connLabel = result?.connectionLabel as string | undefined;
      return {
        text: `Authenticating ${skillId}${connLabel ? ` (${connLabel})` : ""}`,
      };
    }

    // ── Memory & jobs ──────────────────────────────────────────────
    case ToolName.SaveMemory:
      return {
        text: `Saving memory: ${(input?.key as string) ?? (input?.topic as string) ?? "memory"}`,
      };
    case ToolName.RecallMemory:
      return {
        text: `Recalling: ${(input?.query as string) ?? "memories"}`,
      };
    case ToolName.ListJobs:
      return { text: "Listing jobs" };
    case ToolName.ScheduleJob:
      return {
        text: `Scheduling job: ${(input?.schedule as string) ?? "job"}`,
      };
    case ToolName.UpdateJob:
      return { text: "Updating job" };

    // ── Legacy task tools — render a basic hint for old log entries ─
    case ToolName.BackgroundTask:
      return {
        text: `Starting task: ${(input?.title as string) ?? "background task"}`,
      };
    case ToolName.Delegate:
      return { text: `Delegating: ${(input?.title as string) ?? "task"}` };
    case ToolName.CompleteTask:
      return { text: "Completing task", variant: "success" };
    case ToolName.UpdateTask:
      return { text: `Updating: ${(input?.message as string) ?? "task"}` };

    // ── Custom widget tools — no hint, frontend renders its own UI ─
    case ToolName.RequestUserInput:
    case ToolName.RunCommand:
      return null;

    default:
      return null;
  }
}
