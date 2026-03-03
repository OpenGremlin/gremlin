import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { providerCatalog } from "./providers.js";

export async function setDefaultModel(
  ctx: ServiceContext,
  providerId: string,
  modelId: string,
): Promise<void> {
  // Validate provider exists in catalog
  const provider = providerCatalog.find((p) => p.id === providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Validate model exists in provider
  const model = provider.models.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId} for provider ${providerId}`);
  }

  // Validate provider has an API key configured
  const { Item: keyItem } =
    await ctx.resources.ddb.entities.ModelProviderKey.build(GetItemCommand)
      .key({ providerId })
      .send();

  if (!keyItem) {
    throw new Error(
      `No API key configured for provider: ${providerId}. Set an API key first.`,
    );
  }

  // Save default model setting
  await ctx.resources.ddb.entities.Setting.build(PutItemCommand)
    .item({
      key: "defaultModel",
      value: JSON.stringify({ providerId, modelId }),
    })
    .send();

  invalidateModelCache();
}
