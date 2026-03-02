import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  AgentStatus,
  NotificationStatus,
} from "../../gql/resolverTypes.js";
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

  // Unblock the agent and re-trigger with the user's decision
  const actionLabel =
    existing.actions.find((a) => a.id === actionId)?.label ?? actionId;

  ctx.services.agents
    .updateAgentStatus(ctx, existing.agentId, AgentStatus.Active)
    .catch((err) => console.error("Failed to unblock agent:", err));

  ctx.services.orchestrator
    .sendMessage(
      ctx,
      existing.agentId,
      `[Notification resolved] "${existing.message}" → User selected: "${actionLabel}"`,
    )
    .catch((err) => console.error("Failed to re-trigger agent:", err));

  return updated;
}
