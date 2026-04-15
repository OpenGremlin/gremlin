import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "./attachment.js";

function attachmentKey(a: Attachment): string {
  return a.type === "file" ? `file:${a.path}` : `link:${a.url}`;
}

export async function addTaskAttachment(
  ctx: ServiceContext,
  taskId: string,
  attachment: Attachment,
) {
  const table = ctx.resources.ddb.table;
  const tableName = table.getName();
  const docClient = table.getDocumentClient();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const dedupKey = attachmentKey(attachment);

  // Dedup: query this task's attachments for a matching dedupKey.
  // Eventually consistent but sufficient for the attach-file tool's usage.
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk",
      FilterExpression: "dedupKey = :dk",
      ExpressionAttributeValues: {
        ":pk": `TASK_ATTACHMENT#${taskId}`,
        ":dk": dedupKey,
      },
    }),
  );
  if (Items && Items.length > 0) return;

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        _et: "TaskAttachment",
        pk: `ATTACHMENT#${id}`,
        sk: "ATTACHMENT",
        id,
        taskId,
        dedupKey,
        type: attachment.type,
        ...(attachment.type === "file" && { path: attachment.path }),
        ...(attachment.type === "link" && {
          url: attachment.url,
          ...(attachment.title != null && { title: attachment.title }),
          ...(attachment.description != null && {
            description: attachment.description,
          }),
        }),
        createdAt: now,
        // GSI1: query by task
        gsi1pk: `TASK_ATTACHMENT#${taskId}`,
        gsi1sk: now,
        // GSI2: query by path (file attachments only)
        ...(attachment.type === "file" && {
          gsi2pk: "ATTACHMENT_FILE",
          gsi2sk: attachment.path,
        }),
      },
    }),
  );

  // Touch the parent task's updatedAt so subscriptions fire
  const taskKey = { pk: `TASK#${taskId}`, sk: "TASK" };
  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: taskKey,
      UpdateExpression: "SET updatedAt = :now",
      ExpressionAttributeValues: { ":now": now },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (Attributes) {
    const task = Attributes as unknown as TaskItem;
    ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, task);

    // Notify parent so the epic TaskCard re-renders with the new attachment
    if (task.parentId) {
      const parent = await ctx.services.tasks.getTask(ctx, task.parentId);
      if (parent) {
        ctx.resources.pubsub.publish(`taskUpdated:${task.parentId}`, parent);
      }
    }
  }
}
