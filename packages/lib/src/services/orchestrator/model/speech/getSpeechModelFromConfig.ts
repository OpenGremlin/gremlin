import type { SpeechModel } from "ai";
import type { ServiceContext } from "../../../context.js";
import { createProviderSpeechModel } from "./createProviderSpeechModel.js";

/**
 * Resolve the speech model from an agent's config.
 * Returns null if no speech model is configured or available.
 */
export async function getSpeechModelFromConfig(
  ctx: ServiceContext,
  speechModelConfig:
    | { type: string; modelId?: string; connectionId?: string }
    | undefined
    | null,
): Promise<SpeechModel | null> {
  // Try agent-specific speech model
  if (speechModelConfig) {
    try {
      if (
        speechModelConfig.type === "connection" &&
        speechModelConfig.connectionId
      ) {
        const [providerId, modelId] = speechModelConfig.connectionId.split(
          ":",
          2,
        );
        if (providerId && modelId) {
          const apiKey = await ctx.services.integrations.getProviderApiKey(
            ctx.resources,
            providerId,
          );
          if (apiKey) {
            return createProviderSpeechModel(providerId, modelId, apiKey);
          }
        }
      }
    } catch (err) {
      ctx.log.warn(
        { error: (err as Error).message, component: "model" },
        "Failed to resolve agent speech model, trying default",
      );
    }
  }

  // Fall back to default speech model
  const defaultSpeechModel = await ctx.services.integrations.getDefaultModel(
    ctx,
    "defaultSpeechModel",
  );
  if (!defaultSpeechModel) return null;

  try {
    const apiKey = await ctx.services.integrations.getProviderApiKey(
      ctx.resources,
      defaultSpeechModel.providerId,
    );
    if (!apiKey) return null;
    return createProviderSpeechModel(
      defaultSpeechModel.providerId,
      defaultSpeechModel.modelId,
      apiKey,
    );
  } catch (err) {
    ctx.log.warn(
      { error: (err as Error).message, component: "model" },
      "Failed to resolve default speech model",
    );
    return null;
  }
}
