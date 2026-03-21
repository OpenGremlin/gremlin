import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CommandApprovalStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";

/**
 * Return all command approvals with status PENDING.
 * The result set should be small since agents block until each approval is resolved.
 */
export async function getPendingCommandApprovals(ctx: ServiceContext) {
  const table = ctx.resources.ddb.table;
  const result = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk",
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":pk": "COMMAND_APPROVAL",
        ":status": CommandApprovalStatus.Pending,
      },
    }),
  );

  return result.Items ?? [];
}
