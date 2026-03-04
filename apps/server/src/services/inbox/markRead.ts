import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";

export async function markRead(
  ctx: ServiceContext,
  items: InboxItemItem[],
): Promise<void> {
  const table = ctx.resources.ddb.table;

  await Promise.all(
    items.map((item) =>
      table.getDocumentClient().send(
        new UpdateCommand({
          TableName: table.getName(),
          Key: {
            pk: `AGENT_INBOX#${item.agentId}`,
            sk: `ITEM#${item.createdAt}#${item.id}`,
          },
          UpdateExpression: "SET isRead = :true REMOVE gsi2pk, gsi2sk",
          ExpressionAttributeValues: {
            ":true": true,
          },
        }),
      ),
    ),
  );
}
