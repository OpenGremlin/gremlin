import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CommandApprovalStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";

/**
 * Check if there's a pending CommandApproval for a given agent + task.
 * Uses a scan of COMMAND_APPROVAL items filtered by agentId, taskId, and status.
 *
 * This is called by the consumer before processing inbox items to
 * prevent new turns while a command approval is pending.
 */
export async function hasPendingApproval(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<boolean> {
  const table = ctx.resources.ddb.chatTable;
  const result = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk",
      FilterExpression:
        "agentId = :agentId AND taskId = :taskId AND #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":pk": "COMMAND_APPROVAL",
        ":agentId": agentId,
        ":taskId": taskId,
        ":status": CommandApprovalStatus.Pending,
      },
      Limit: 1,
    }),
  );

  return (result.Items?.length ?? 0) > 0;
}
