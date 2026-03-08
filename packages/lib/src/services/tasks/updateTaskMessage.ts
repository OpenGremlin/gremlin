import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function updateTaskMessage(
  ctx: ServiceContext,
  taskId: string,
  message: string,
) {
  const now = new Date().toISOString();

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
    .item({
      id: taskId,
      agentId: task.agentId,
      createdAt: task.createdAt,
      message,
      updatedAt: now,
    })
    .options({ returnValues: "NONE" })
    .send();

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    message,
    updatedAt: now,
  });
}
