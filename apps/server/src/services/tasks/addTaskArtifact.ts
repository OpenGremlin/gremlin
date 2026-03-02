import { PutCommand } from "@aws-sdk/lib-dynamodb";
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

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...task,
        artifacts,
        updatedAt: now,
        _et: "Task",
        pk: "TASK",
        sk: `TASK#${taskId}`,
        gsi1pk: `TASK_AGENT#${task.agentId}`,
        gsi1sk: task.createdAt,
      },
    }),
  );

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    artifacts,
    updatedAt: now,
  });
}
