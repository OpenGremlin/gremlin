import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { NotificationStatus } from "../../enums.js";
import type { NotificationItem } from "../../resources/ddb/schema/notification.js";
import type { ServiceContext } from "../context.js";
import { getNotification } from "./getNotification.js";

export async function resolveNotification(
  ctx: ServiceContext,
  id: string,
  action: string,
): Promise<NotificationItem> {
  const existing = await getNotification(ctx, id);
  if (!existing) throw new Error(`Notification ${id} not found`);

  const updated = {
    ...existing,
    status: NotificationStatus.Resolved,
    resolvedAction: action,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...updated,
        _et: "Notification",
        pk: "NOTIFICATION",
        sk: `NOTIFICATION#${id}`,
        gsi1pk: `NOTIF_STATUS#${NotificationStatus.Resolved}`,
        gsi1sk: existing.createdAt,
      },
    }),
  );

  // Enqueue the reply — the consumer writes it to the log with full context
  ctx.services.inbox
    .enqueueWork(ctx, existing.agentId, existing.lane, {
      type: "user_notification_reply",
      payload: { notificationId: id, action },
    })
    .catch((err) =>
      ctx.log.error(
        { err, notificationId: id, component: "notifications" },
        "Failed to enqueue notification reply",
      ),
    );

  return updated;
}
