import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { providers } from "./providers.js";

type DefaultModelKey = "defaultModel" | "defaultImageModel";

const KEY_TO_MODEL_TYPE: Record<DefaultModelKey, string> = {
  defaultModel: "chat",
  defaultImageModel: "image",
};

export async function setDefaultModel(
  ctx: ServiceContext,
  providerId: string,
  modelId: string,
  key: DefaultModelKey = "defaultModel",
): Promise<void> {
  const provider = providers.find(
    (p) => p.id === providerId && p.category === "ai",
  );
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }

  const enabled = await getEnabledModels(ctx.resources, providerId);
  if (!enabled.some((m) => m.id === modelId)) {
    throw new Error(`Model not enabled: ${modelId}. Enable it first.`);
  }

  const model = enabled.find((m) => m.id === modelId);

  await ctx.resources.ddb.entities.DefaultModel.build(PutItemCommand)
    .item({
      modelType: KEY_TO_MODEL_TYPE[key],
      providerId,
      modelId,
      modelName: model?.name ?? modelId,
    })
    .send();

  invalidateModelCache();
}
