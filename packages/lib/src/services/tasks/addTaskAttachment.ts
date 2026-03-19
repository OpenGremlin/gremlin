import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "./attachment.js";

export async function addTaskAttachment(
  ctx: ServiceContext,
  taskId: string,
  attachment: Attachment,
) {
  const table = ctx.resources.ddb.table;
  const now = new Date().toISOString();

  const { Attributes } = await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: "TASK", sk: `TASK#${taskId}` },
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
