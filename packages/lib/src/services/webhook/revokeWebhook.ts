import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function revokeWebhook(
  ctx: ServiceContext,
  id: string,
): Promise<void> {
  await ctx.resources.ddb.entities.Webhook.build(UpdateItemCommand)
    .item({ id, revokedAt: new Date().toISOString() })
    .send();
}
