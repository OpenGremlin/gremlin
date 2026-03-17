import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";
import { getProviderApiKey } from "./getProviderApiKey.js";
import { providers } from "./providers.js";

export async function setDefaultModel(
  ctx: ServiceContext,
  providerId: string,
  modelId: string,
): Promise<void> {
  const provider = providers.find(
    (p) => p.id === providerId && p.category === "ai",
  );
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }

  if (provider.connectionType === "bedrock") {
    // Bedrock uses server-side credentials — verify the model has been enabled
    const model = provider.models?.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId} for provider ${providerId}`);
    }
    const enabled = await getBedrockEnabledModels(ctx.resources);
    if (!enabled.includes(modelId)) {
      throw new Error(
        `Bedrock model not enabled: ${modelId}. Enable it first.`,
      );
    }
  } else {
    // For apikey providers, just verify a key exists — model IDs are dynamic
    const apiKey = await getProviderApiKey(ctx.resources, providerId);
    if (!apiKey) {
      throw new Error(
        `No API key configured for provider: ${providerId}. Connect an API key first.`,
      );
    }
  }

  await ctx.resources.ddb.entities.Setting.build(PutItemCommand)
    .item({
      key: "defaultModel",
      value: JSON.stringify({ providerId, modelId }),
    })
    .send();

  invalidateModelCache();
}
