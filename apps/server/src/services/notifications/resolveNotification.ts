import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { AgentStatus, NotificationStatus } from "../../gql/resolverTypes.js";
import type { NotificationItem } from "../../resources/ddb/schema/notification.js";
import type { ServiceContext } from "../context.js";
import { getNotification } from "./getNotification.js";

export async function resolveNotification(
  ctx: ServiceContext,
  id: string,
  actionId: string,
): Promise<NotificationItem> {
  const existing = await getNotification(ctx, id);
  if (!existing) throw new Error(`Notification ${id} not found`);

  const updated = {
    ...existing,
    status: NotificationStatus.Resolved,
    resolvedAction: actionId,
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

  // Unblock the agent
  ctx.services.agents
    .updateAgentStatus(ctx, existing.agentId, AgentStatus.Active)
    .catch((err) => console.error("Failed to unblock agent:", err));

  // Enqueue the reply — the consumer writes it to the log with full context
  ctx.services.inbox
    .enqueueWork(ctx, existing.agentId, {
      type: "user_notification_reply",
      payload: { notificationId: id, actionId },
    })
    .catch((err) =>
      console.error("Failed to enqueue notification reply:", err),
    );

  return updated;
}
