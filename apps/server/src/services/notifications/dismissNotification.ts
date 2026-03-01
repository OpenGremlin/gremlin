import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
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

  await ctx.resources.ddb.entities.Notification.build(PutItemCommand)
    .item(updated)
    .send();

  return updated;
}
