import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function revokeKey(
  ctx: ServiceContext,
  keyId: string,
): Promise<void> {
  await ctx.resources.ddb.entities.WebhookKey.build(UpdateItemCommand)
    .item({ id: keyId, revokedAt: new Date().toISOString() })
    .send();
}
