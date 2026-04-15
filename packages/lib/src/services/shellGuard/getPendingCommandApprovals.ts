import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

/**
 * Return all command approvals (pending and resolved).
 * The client filters to pending where needed.
 */
export async function getPendingCommandApprovals(ctx: ServiceContext) {
  const table = ctx.resources.ddb.chatTable;
  const result = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "COMMAND_APPROVAL",
      },
    }),
  );

  return result.Items ?? [];
}
