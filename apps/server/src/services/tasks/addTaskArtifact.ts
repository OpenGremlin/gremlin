import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function addTaskArtifact(
  ctx: ServiceContext,
  taskId: string,
  documentId: string,
) {
  const table = ctx.resources.ddb.table;
  const now = new Date().toISOString();

  const { Attributes } = await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: "TASK", sk: `TASK#${taskId}` },
      UpdateExpression:
        "SET artifacts = list_append(if_not_exists(artifacts, :empty), :doc), updatedAt = :now",
      ExpressionAttributeValues: {
        ":doc": [documentId],
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
