import type { Resources } from "../../resources/index.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { providers } from "./providers.js";

export interface EnabledModelEntry {
  providerId: string;
  modelId: string;
  modelName: string | null;
}

/**
 * Returns all enabled models across every AI provider.
 */
export async function getAllEnabledModels(
  resources: Resources,
): Promise<EnabledModelEntry[]> {
  const aiProviders = providers.filter((p) => p.category === "ai");

  const results = await Promise.all(
    aiProviders.map(async (p) => {
      const modelIds = await getEnabledModels(resources, p.id);
      return modelIds.map((modelId) => ({
        providerId: p.id,
        modelId,
        modelName: null as string | null,
      }));
    }),
  );

  return results.flat();
}
