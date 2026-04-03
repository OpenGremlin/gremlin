import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";

export interface DefaultModelResult {
  providerId: string;
  modelId: string;
  modelName?: string | null;
}

type DefaultModelKey =
  | "defaultModel"
  | "defaultImageModel"
  | "defaultSpeechModel";

const KEY_TO_MODEL_TYPE: Record<DefaultModelKey, string> = {
  defaultModel: "chat",
  defaultImageModel: "image",
  defaultSpeechModel: "speech",
};

export async function getDefaultModel(
  ctx: ServiceContext,
  key: DefaultModelKey = "defaultModel",
): Promise<DefaultModelResult | null> {
  const modelType = KEY_TO_MODEL_TYPE[key];

  const { Item } = await ctx.resources.ddb.entities.DefaultModel.build(
    GetItemCommand,
  )
    .key({ modelType })
    .send();

  if (Item) {
    return {
      providerId: Item.providerId,
      modelId: Item.modelId,
      modelName: Item.modelName,
    };
  }

  // Fallback: read from legacy Setting and lazy-migrate
  const { Item: legacy } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key })
    .send();

  if (!legacy) return null;

  const parsed = JSON.parse(legacy.value) as DefaultModelResult;
  await ctx.resources.ddb.entities.DefaultModel.build(PutItemCommand)
    .item({
      modelType,
      providerId: parsed.providerId,
      modelId: parsed.modelId,
      modelName: parsed.modelName ?? undefined,
    })
    .send();
  return parsed;
}
