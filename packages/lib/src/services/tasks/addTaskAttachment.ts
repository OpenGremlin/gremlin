import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
  const key = { pk: "TASK", sk: `TASK#${taskId}` };

  const { Item } = await table
    .getDocumentClient()
    .send(new GetCommand({ TableName: table.getName(), Key: key }));

  const existing =
    ((Item as TaskItem | undefined)?.attachments as Attachment[] | undefined) ??
    [];
  const newKey = attachmentKey(attachment);
  if (existing.some((a) => attachmentKey(a) === newKey)) {
    return;
  }

  const now = new Date().toISOString();

  const { Attributes } = await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: key,
      UpdateExpression:
        "SET attachments = list_append(if_not_exists(attachments, :empty), :item), updatedAt = :now",
      ExpressionAttributeValues: {
        ":item": [attachment],
        ":empty": [],
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (Attributes) {
    ctx.resources.pubsub.publish(
      `taskUpdated:${taskId}`,
      Attributes as unknown as TaskItem,
    );
  }
}
