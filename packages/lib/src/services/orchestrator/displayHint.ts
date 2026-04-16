import { ToolName } from "../../enums.js";

export type DisplayHint = {
  text: string;
  variant?: "success" | "error" | "warning";
  /** Short error message extracted from the tool result, if present. */
  error?: string;
};

/**
 * Extract an error message from a tool result, if present.
 * Handles the common patterns tools use to report errors.
 */
function extractToolError(
  result: Record<string, unknown> | null,
): string | undefined {
  if (!result) return undefined;
  if (typeof result.error === "string") return result.error;
  if (result.type === "error" && typeof result.message === "string")
    return result.message;
  return undefined;
}

/**
 * Compute a short, human-readable display hint for a tool call.
 * Returns `null` for tools that should not render a status line
 * (e.g. hidden internal tools, or tools with custom UI widgets).
 *
 * The backend owns the message text and semantic variant;
 * the frontend owns the icon.
 */
export function computeDisplayHint(
  toolName: string,
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
): DisplayHint | null {
  const hint = computeDisplayHintInner(toolName, input, result);
  if (!hint) return null;

  // Layer on a generic error from the tool result.
  // Sets variant to "error" so the status icon reflects the failure too.
  const error = extractToolError(result);
  if (error) {
    return { ...hint, error, variant: "error" };
  }
  return hint;
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

    // ── Memory & jobs ───────────────────────────────────────────��──
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
