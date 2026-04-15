import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";

export async function getUnreadItems(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
): Promise<InboxItemItem[]> {
  const table = ctx.resources.ddb.chatTable;
  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      FilterExpression: "isRead = :false",
      ExpressionAttributeValues: {
        ":pk": `AGENT_INBOX#${agentId}#${lane}`,
        ":prefix": "ITEM#",
        ":false": false,
      },
    }),
  );

  return (Items ?? []) as InboxItemItem[];
}
