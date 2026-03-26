import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { providers } from "./providers.js";

type DefaultModelKey = "defaultModel" | "defaultImageModel";

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

  // Verify the model has been enabled for this provider
  const enabled = await getEnabledModels(ctx.resources, providerId);
  if (!enabled.includes(modelId)) {
    throw new Error(`Model not enabled: ${modelId}. Enable it first.`);
  }

  await ctx.resources.ddb.entities.Setting.build(PutItemCommand)
    .item({
      key,
      value: JSON.stringify({ providerId, modelId }),
    })
    .send();

  invalidateModelCache();
}
