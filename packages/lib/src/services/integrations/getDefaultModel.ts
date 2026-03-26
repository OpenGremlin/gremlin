import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";

export interface DefaultModelResult {
  providerId: string;
  modelId: string;
  modelName?: string | null;
}

type DefaultModelKey = "defaultModel" | "defaultImageModel";

export async function getDefaultModel(
  ctx: ServiceContext,
  key: DefaultModelKey = "defaultModel",
): Promise<DefaultModelResult | null> {
  const { Item } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key })
    .send();

  if (!Item) return null;

  return JSON.parse(Item.value) as DefaultModelResult;
}
