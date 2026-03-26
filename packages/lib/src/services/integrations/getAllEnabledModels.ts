import type { Resources } from "../../resources/index.js";
import type { EnabledModel } from "./getEnabledModels.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { providers } from "./providers.js";

export interface EnabledModelEntry {
  providerId: string;
  modelId: string;
  modelName: string | null;
  modelType: string;
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
      const models: EnabledModel[] = await getEnabledModels(resources, p.id);
      return models.map((m) => ({
        providerId: p.id,
        modelId: m.id,
        modelName: m.name !== m.id ? m.name : null,
        modelType: m.type,
      }));
    }),
  );

  return results.flat();
}
