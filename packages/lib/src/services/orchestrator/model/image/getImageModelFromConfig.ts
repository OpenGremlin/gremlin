import type { ImageModel } from "ai";
import type { ServiceContext } from "../../../context.js";
import { bedrock } from "../bedrockClient.js";
import { createProviderImageModel } from "./createProviderImageModel.js";

/**
 * Resolve the image model from an agent's config.
 * Returns null if no image model is configured or available.
 */
export async function getImageModelFromConfig(
  ctx: ServiceContext,
  imageModelConfig:
    | { type: string; modelId?: string; connectionId?: string }
    | undefined
    | null,
): Promise<ImageModel | null> {
  // Try agent-specific image model
  if (imageModelConfig) {
    try {
      if (imageModelConfig.type === "bedrock" && imageModelConfig.modelId) {
        return bedrock.image(imageModelConfig.modelId);
      }
      if (
        imageModelConfig.type === "connection" &&
        imageModelConfig.connectionId
      ) {
        const [providerId, modelId] = imageModelConfig.connectionId.split(
          ":",
          2,
        );
        if (providerId && modelId) {
          const apiKey = await ctx.services.integrations.getProviderApiKey(
            ctx.resources,
            providerId,
          );
          if (apiKey) {
            return createProviderImageModel(providerId, modelId, apiKey);
          }
        }
      }
    } catch (err) {
      ctx.log.warn(
        { error: (err as Error).message, component: "model" },
        "Failed to resolve agent image model, trying default",
      );
    }
  }

  // Fall back to default image model
  const defaultImageModel = await ctx.services.integrations.getDefaultModel(
    ctx,
    "defaultImageModel",
  );
  if (!defaultImageModel) return null;

  try {
    if (defaultImageModel.providerId === "bedrock") {
      return bedrock.image(defaultImageModel.modelId);
    }
    const apiKey = await ctx.services.integrations.getProviderApiKey(
      ctx.resources,
      defaultImageModel.providerId,
    );
    if (!apiKey) return null;
    return createProviderImageModel(
      defaultImageModel.providerId,
      defaultImageModel.modelId,
      apiKey,
    );
  } catch (err) {
    ctx.log.warn(
      { error: (err as Error).message, component: "model" },
      "Failed to resolve default image model",
    );
    return null;
  }
}
