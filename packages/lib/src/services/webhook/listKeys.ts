import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { WebhookKeyItem } from "../../resources/ddb/schema/webhookKey.js";
import type { ServiceContext } from "../context.js";

export async function listKeys(
  ctx: ServiceContext,
  webhookId: string,
): Promise<WebhookKeyItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.WebhookKey)
    .query({
      index: "gsi1",
      partition: `WEBHOOK_KEYS#${webhookId}`,
    })
    .send();

  return (Items ?? []) as WebhookKeyItem[];
}
