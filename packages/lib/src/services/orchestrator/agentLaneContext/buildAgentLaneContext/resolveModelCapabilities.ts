import type { ServiceContext } from "../../../context.js";
import type { EnabledModel } from "../../../integrations/getEnabledModels.js";

/**
 * Resolve the selected model's metadata to check capability flags.
 */
export async function resolveModelCapabilities(
  ctx: ServiceContext,
  agentModel:
    | { type: string; modelId?: string; connectionId?: string }
    | undefined
    | null,
): Promise<{ supportsImages: boolean; supportsReasoning: boolean }> {
  const defaults = { supportsImages: true, supportsReasoning: false };
  if (!agentModel) return defaults;
  let providerId: string;
  let modelId: string;
  if (agentModel.type === "bedrock" && agentModel.modelId) {
    providerId = "bedrock";
    modelId = agentModel.modelId;
  } else if (agentModel.type === "connection" && agentModel.connectionId) {
    [providerId, modelId] = agentModel.connectionId.split(":", 2);
  } else {
    return defaults;
  }
  let models: EnabledModel[];
  try {
    models = await ctx.services.integrations.getEnabledModels(
      ctx.resources,
      providerId,
    );
  } catch {
    return defaults;
  }
  const match = models.find((m) => m.id === modelId);
  return {
    supportsImages: match?.supportedModalities
      ? match.supportedModalities.includes("image")
      : true,
    supportsReasoning: match?.supportsReasoning ?? false,
  };
}
