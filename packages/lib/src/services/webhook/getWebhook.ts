import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { WebhookItem } from "../../resources/ddb/schema/webhook.js";
import type { ServiceContext } from "../context.js";

export async function getWebhook(
  ctx: ServiceContext,
  id: string,
): Promise<WebhookItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Webhook.build(
    GetItemCommand,
  )
    .key({ id })
    .send();
  return (Item ?? null) as WebhookItem | null;
}
