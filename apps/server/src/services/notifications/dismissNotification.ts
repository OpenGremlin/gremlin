import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { NotificationStatus } from "../../gql/resolverTypes.js";
import type { NotificationItem } from "../../resources/ddb/schema/notification.js";
import type { ServiceContext } from "../context.js";
import { getNotification } from "./getNotification.js";

export async function dismissNotification(
  ctx: ServiceContext,
  id: string,
): Promise<NotificationItem> {
  const existing = await getNotification(ctx, id);
  if (!existing) throw new Error(`Notification ${id} not found`);

  const updated = { ...existing, status: NotificationStatus.Dismissed };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...updated,
        _et: "Notification",
        pk: "NOTIFICATION",
        sk: `NOTIFICATION#${id}`,
        gsi1pk: `NOTIF_STATUS#${NotificationStatus.Dismissed}`,
        gsi1sk: existing.createdAt,
      },
    }),
  );

  return updated;
}
