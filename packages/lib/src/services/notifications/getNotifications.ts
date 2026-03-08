import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { NotificationItem } from "../../resources/ddb/schema/notification.js";
import type { ServiceContext } from "../context.js";

export async function getNotifications(
  ctx: ServiceContext,
): Promise<NotificationItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Notification)
    .query({ partition: "NOTIFICATION" })
    .send();

  return Items ?? [];
}
