import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";

export async function addTaskArtifact(
  ctx: ServiceContext,
  taskId: string,
  documentId: string,
) {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const artifacts = [...task.artifacts, documentId];
  const now = new Date().toISOString();

  await ctx.resources.ddb.entities.Task.build(PutItemCommand)
    .item({
      ...task,
      artifacts,
      updatedAt: now,
    })
    .send();

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    artifacts,
    updatedAt: now,
  });
}
