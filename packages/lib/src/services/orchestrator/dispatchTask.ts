import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import { buildTaskBrief } from "./buildTaskBrief.js";

/**
 * Move a task to `in_progress` and enqueue a `run_task` on its lane with
 * a brief containing the task's full details. Used wherever a task should
 * start running immediately: reconciler dispatch, scheduled-job creation,
 * and child spawning from the `taskCreate` tool.
 */
export async function dispatchTask(
  ctx: ServiceContext,
  task: TaskItem,
): Promise<void> {
  await ctx.services.tasks.updateTaskStatus(ctx, task.id, "in_progress");
  const brief = await buildTaskBrief(ctx, task);
  await ctx.services.inbox.enqueueWork(ctx, task.agentId, `task:${task.id}`, {
    type: "run_task",
    payload: { taskId: task.id, prompt: brief },
  });
}
