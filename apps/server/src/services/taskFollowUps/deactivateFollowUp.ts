import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

export async function deactivateFollowUp(
  ctx: ServiceContext,
  followUpId: string,
) {
  const now = new Date().toISOString();

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: {
        pk: "TASK_FOLLOW_UP",
        sk: `TASK_FOLLOW_UP#${followUpId}`,
      },
      UpdateExpression:
        "SET active = :active, scheduledAt = :scheduledAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: {
        ":active": false,
        ":scheduledAt": now,
        ":gsi1pk": "FOLLOWUP_INACTIVE",
        ":gsi1sk": now,
      },
    }),
  );
}
