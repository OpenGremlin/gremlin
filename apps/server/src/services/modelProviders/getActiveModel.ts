import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";

export interface ActiveModelResult {
  providerId: string;
  modelId: string;
}

export async function getActiveModel(
  ctx: ServiceContext,
): Promise<ActiveModelResult | null> {
  const { Item } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "activeModel" })
    .send();

  if (!Item) return null;

  return JSON.parse(Item.value) as ActiveModelResult;
}
