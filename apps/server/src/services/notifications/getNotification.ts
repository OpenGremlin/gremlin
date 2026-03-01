import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { NotificationItem } from "../../resources/ddb/schema/notification.js";
import type { ServiceContext } from "../context.js";

export async function getNotification(
  ctx: ServiceContext,
  id: string,
): Promise<NotificationItem | null> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Notification)
    .query({ partition: "NOTIFICATION", range: { eq: `NOTIFICATION#${id}` } })
    .send();

  return Items?.[0] ?? null;
}
