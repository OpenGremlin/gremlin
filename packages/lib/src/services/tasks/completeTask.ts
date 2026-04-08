import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

/**
 * Mark a task complete by setting `completedAt`. Used by `replyToAssigner`
 * when the worker sends its final message.
 */
export async function completeTask(ctx: ServiceContext, taskId: string) {
  const now = new Date().toISOString();

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.completedAt) return;

  await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
    .item({
      id: taskId,
      agentId: task.agentId,
      createdAt: task.createdAt,
      updatedAt: now,
      completedAt: now,
    })
    .options({ returnValues: "NONE" })
    .send();

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    updatedAt: now,
    completedAt: now,
  });
}
