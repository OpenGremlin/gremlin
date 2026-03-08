import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";
import { providerCatalog } from "./providers.js";

export interface ModelProviderResult {
  id: string;
  name: string;
  hasApiKey: boolean;
  models: {
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    reasoning: boolean;
    inputCost?: number;
    outputCost?: number;
  }[];
}

export async function getModelProviders(
  ctx: ServiceContext,
): Promise<ModelProviderResult[]> {
  const results = await Promise.all(
    providerCatalog.map(async (provider) => {
      const { Item } = await ctx.resources.ddb.entities.ModelProviderKey.build(
        GetItemCommand,
      )
        .key({ providerId: provider.id })
        .send();

      return {
        id: provider.id,
        name: provider.name,
        hasApiKey: !!Item,
        models: provider.models,
      };
    }),
  );

  return results;
}
