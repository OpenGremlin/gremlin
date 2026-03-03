import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { providers } from "./providers.js";
import { getProviderApiKey } from "./getProviderApiKey.js";

export async function setActiveModel(
  ctx: ServiceContext,
  providerId: string,
  modelId: string,
): Promise<void> {
  const provider = providers.find((p) => p.id === providerId && p.category === "ai");
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }

  const model = provider.models?.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId} for provider ${providerId}`);
  }

  const apiKey = await getProviderApiKey(ctx.resources, providerId);
  if (!apiKey) {
    throw new Error(
      `No API key configured for provider: ${providerId}. Connect an API key first.`,
    );
  }

  await ctx.resources.ddb.entities.Setting.build(PutItemCommand)
    .item({
      key: "activeModel",
      value: JSON.stringify({ providerId, modelId }),
    })
    .send();

  invalidateModelCache();
}
