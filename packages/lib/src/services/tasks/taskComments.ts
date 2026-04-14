import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { TaskCommentItem } from "../../resources/ddb/schema/taskComment.js";
import type { ServiceContext } from "../context.js";

export async function addComment(
  ctx: ServiceContext,
  input: { taskId: string; author: string; text: string },
): Promise<TaskCommentItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const item: TaskCommentItem = {
    id,
    taskId: input.taskId,
    author: input.author,
    text: input.text,
    createdAt: now,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "TaskComment",
        pk: `TASK_COMMENT#${input.taskId}`,
        sk: `COMMENT#${now}#${id}`,
      },
    }),
  );

  return item;
}

/** Get all comments for a task, ordered chronologically (ascending). */
export async function getComments(
  ctx: ServiceContext,
  taskId: string,
): Promise<TaskCommentItem[]> {
  const table = ctx.resources.ddb.table;
  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `TASK_COMMENT#${taskId}`,
        ":prefix": "COMMENT#",
      },
      ScanIndexForward: true,
    }),
  );

  return (Items ?? []) as TaskCommentItem[];
}

/** Get the most recent comment for a task, or undefined if none exist. */
export async function getLatestComment(
  ctx: ServiceContext,
  taskId: string,
): Promise<TaskCommentItem | undefined> {
  const table = ctx.resources.ddb.table;
  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `TASK_COMMENT#${taskId}`,
        ":prefix": "COMMENT#",
      },
      ScanIndexForward: false,
      Limit: 1,
    }),
  );

  return (Items?.[0] as TaskCommentItem) ?? undefined;
}
