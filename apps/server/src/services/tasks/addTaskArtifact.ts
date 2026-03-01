import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function addTaskArtifact(
  ctx: ServiceContext,
  taskId: string,
  documentId: string,
) {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const artifacts = [...(task.artifacts ?? []), documentId];

  await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
    .item({
      id: taskId,
      agentId: task.agentId,
      createdAt: task.createdAt,
      artifacts,
      updatedAt: new Date().toISOString(),
    })
    .options({ returnValues: "NONE" })
    .send();

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    artifacts,
  });
}
