import { ToolName } from "../../enums.js";

export type DisplayHint = {
  text: string;
  variant?: "success" | "error" | "warning";
};

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
  switch (toolName) {
    // ── Task & messaging ───────────────────────────────────────────
    case ToolName.UpdateTaskMessage:
      return { text: (input?.message as string) || "Progress update" };
    case ToolName.ReplyToAssigner: {
      const isFinal = (input?.final as boolean) || input?.kind === "final";
      return {
        text: isFinal ? "Replied with final result" : "Sent update to assigner",
      };
    }
    case ToolName.Delegate: {
      if (result && "error" in result) {
        return {
          text: `Delegation rejected: ${result.error}`,
          variant: "error",
        };
      }
      const target =
        (result?.targetName as string | undefined) ??
        (input?.targetAgentId as string | undefined) ??
        "teammate";
      const title = (input?.title as string | undefined) ?? "task";
      return { text: `Delegated "${title}" to @${target}` };
    }

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
        text: `Attached file: ${(input?.path as string) ?? "unknown"}`,
      };
    case ToolName.AttachLink:
      return {
        text: `Attached link: ${(input?.title as string) ?? (input?.url as string) ?? "unknown"}`,
      };

    // ── Sandbox ────────────────────────────────────────────────────
    case ToolName.EnsureSandbox: {
      const status = result?.status as string | undefined;
      if (status === "ready")
        return { text: "Sandbox ready", variant: "success" };
      if (status === "error")
        return {
          text: `Sandbox error: ${(result?.error as string) ?? "unknown"}`,
          variant: "error",
        };
      return { text: "Connecting to sandbox…", variant: "warning" };
    }

    // ── Media ──────────────────────────────────────────────────────
    case ToolName.ViewImage: {
      if (result?.type === "error")
        return {
          text: `${(result?.message as string) ?? "Image error"}`,
          variant: "error",
        };
      return {
        text: `Viewing image: ${(input?.path as string) ?? "unknown"}`,
      };
    }
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
    case ToolName.ReadSkill: {
      const skillId = (input?.skillId as string) ?? "skill";
      if (result?.error)
        return {
          text: `Failed to read ${skillId}: ${result.error}`,
          variant: "error",
        };
      return { text: `Reading skill: ${skillId}` };
    }
    case ToolName.ReadSkillReference: {
      if (result?.error)
        return {
          text: `Failed to read reference: ${result.error}`,
          variant: "error",
        };
      return {
        text: `Reading reference: ${(input?.reference as string) ?? "unknown"}`,
      };
    }
    case ToolName.Authenticate: {
      const skillId = (input?.skillId as string) ?? "skill";
      if (result?.error)
        return { text: `Auth failed: ${skillId}`, variant: "error" };
      if (!result) return { text: `Authenticating ${skillId}…` };
      const connLabel = result?.connectionLabel as string | undefined;
      return {
        text: `Authenticated ${skillId}${connLabel ? ` (${connLabel})` : ""}`,
      };
    }

    // ── Memory & jobs ───────────────────────────────────────────��──
    case ToolName.SaveMemory:
      return {
        text: `Saved memory: ${(input?.key as string) ?? (input?.topic as string) ?? "memory"}`,
      };
    case ToolName.RecallMemory:
      return {
        text: `Recalled: ${(input?.query as string) ?? "memories"}`,
      };
    case ToolName.ListJobs:
      return { text: "Listed jobs" };
    case ToolName.ScheduleJob:
      return {
        text: `Scheduled job: ${(input?.schedule as string) ?? "job"}`,
      };
    case ToolName.UpdateJob:
      return { text: "Updated job" };

    // ── Custom widget tools — no hint, frontend renders its own UI ─
    case ToolName.BackgroundTask:
    case ToolName.RequestUserInput:
    case ToolName.RunCommand:
      return null;

    default:
      return null;
  }
}
