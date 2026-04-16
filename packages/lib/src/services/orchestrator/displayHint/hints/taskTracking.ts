import type { DisplayHint, HintBuilder } from "../types.js";

function taskTitle(
  input: Record<string, unknown> | null,
  result: Record<string, unknown> | null,
): string {
  return (
    (result?.title as string) ??
    ((result?.task as Record<string, unknown>)?.title as string) ??
    (input?.title as string) ??
    (input?.taskId as string) ??
    "task"
  );
}

const taskCreate: HintBuilder = (input) => ({
  text: `Creating task: ${(input?.title as string) ?? "task"}`,
});

const taskShow: HintBuilder = (input, result) => ({
  text: `Viewing task: ${taskTitle(input, result)}`,
});

const taskUpdate: HintBuilder = (input, result) => {
  const parts = [taskTitle(input, result)];
  if (input?.status) parts.push(`→ ${input.status}`);
  if (input?.status === "closed") {
    return {
      text: `Closing task: ${parts.join(" ")}`,
      variant: "success",
    } satisfies DisplayHint;
  }
  return { text: `Updating task: ${parts.join(" ")}` };
};

// Legacy display hints — taskClose and taskReopen are now handled by
// taskUpdate with status: "closed" / "open", but old log entries may
// still reference these tool names.
const taskClose: HintBuilder = (input, result) => ({
  text: `Closing task: ${taskTitle(input, result)}`,
  variant: "success",
});

const taskReopen: HintBuilder = (input, result) => ({
  text: `Reopening task: ${taskTitle(input, result)}`,
});

const taskList: HintBuilder = () => ({ text: "Listing tasks" });

const taskReady: HintBuilder = () => ({ text: "Checking ready work" });

const taskDep: HintBuilder = (input) => ({
  text: `${(input?.action as string) === "remove" ? "Removing" : "Adding"} dependency`,
});

const taskDepTree: HintBuilder = (input, result) => ({
  text: `Viewing dependency tree: ${taskTitle(input, result)}`,
});

const taskBlocked: HintBuilder = () => ({ text: "Checking blocked tasks" });

export const taskTrackingHints: Record<string, HintBuilder> = {
  taskCreate,
  taskShow,
  taskUpdate,
  taskClose,
  taskReopen,
  taskList,
  taskReady,
  taskDep,
  taskDepTree,
  taskBlocked,
};
