import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";

const INBOX_READ_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function markRead(
  ctx: ServiceContext,
  items: InboxItemItem[],
): Promise<void> {
  const table = ctx.resources.ddb.table;
  const ttl = Math.floor(Date.now() / 1000) + INBOX_READ_TTL_SECONDS;

  await Promise.all(
    items.map((item) =>
      table.getDocumentClient().send(
        new UpdateCommand({
          TableName: table.getName(),
          Key: {
            pk: `AGENT_INBOX#${item.agentId}`,
            sk: `ITEM#${item.createdAt}#${item.id}`,
          },
          UpdateExpression:
            "SET isRead = :true, #ttl = :ttl REMOVE gsi2pk, gsi2sk",
          ExpressionAttributeNames: { "#ttl": "ttl" },
          ExpressionAttributeValues: {
            ":true": true,
            ":ttl": ttl,
          },
        }),
      ),
    ),
  );
}
