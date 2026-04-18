import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { WebhookItem } from "../../resources/ddb/schema/webhook.js";
import type { ServiceContext } from "../context.js";

export async function listWebhooks(
  ctx: ServiceContext,
): Promise<WebhookItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Webhook)
    .query({
      partition: "WEBHOOK",
      range: { beginsWith: "WEBHOOK#" },
    })
    .send();

  return (Items ?? []) as WebhookItem[];
}
