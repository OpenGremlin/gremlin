import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

// Legacy task tools — render a basic hint for old log entries.

const backgroundTask: HintBuilder = (input) => ({
  text: `Starting task: ${(input?.title as string) ?? "background task"}`,
});

const delegate: HintBuilder = (input) => ({
  text: `Delegating: ${(input?.title as string) ?? "task"}`,
});

const completeTask: HintBuilder = () => ({
  text: "Completing task",
  variant: "success" as const,
});

const updateTask: HintBuilder = (input) => ({
  text: `Updating: ${(input?.message as string) ?? "task"}`,
});

export const legacyTaskHints: Record<string, HintBuilder> = {
  [ToolName.BackgroundTask]: backgroundTask,
  [ToolName.Delegate]: delegate,
  [ToolName.CompleteTask]: completeTask,
  [ToolName.UpdateTask]: updateTask,
};
