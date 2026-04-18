import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";
import { isValidScopePattern } from "./validation.js";

export async function updateScopes(
  ctx: ServiceContext,
  id: string,
  scopes: string[],
): Promise<void> {
  if (scopes.length === 0) {
    throw new Error("Webhook must have at least one scope");
  }
  for (const s of scopes) {
    if (!isValidScopePattern(s)) {
      throw new Error(`Invalid scope pattern: '${s}'`);
    }
  }
  await ctx.resources.ddb.entities.Webhook.build(UpdateItemCommand)
    .item({ id, scopes })
    .send();
}
