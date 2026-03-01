import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
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

  await ctx.resources.ddb.entities.Notification.build(PutItemCommand)
    .item(updated)
    .send();

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
