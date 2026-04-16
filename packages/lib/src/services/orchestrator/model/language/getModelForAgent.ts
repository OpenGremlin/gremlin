import type { ServiceContext } from "../../../context.js";
import { lookupModelMetadata } from "../../../integrations/modelMetadataStore.js";
import { bedrock } from "../bedrockClient.js";
import type { ModelResult } from "../cache.js";
import { createProviderModel } from "./createProviderModel.js";
import { getModelResult } from "./getModelResult.js";

/**
 * Resolve the model for a specific agent. Checks the agent's configured model
 * first, falls back to the system default, then to Bedrock.
 */
export async function getModelForAgent(
  ctx: ServiceContext,
  agentId: string,
): Promise<ModelResult> {
  if (ctx.modelOverride) {
    return {
      model: ctx.modelOverride.model,
      maxInputTokens: ctx.modelOverride.maxInputTokens,
    };
  }

  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  const agentModel = agent?.config?.model;

  if (agentModel) {
    try {
      if (agentModel.type === "bedrock" && agentModel.modelId) {
        const meta = lookupModelMetadata("bedrock", agentModel.modelId);
        return {
          model: bedrock(agentModel.modelId),
          maxInputTokens: meta?.maxInputTokens,
        };
      }
      if (agentModel.type === "connection" && agentModel.connectionId) {
        const [providerId, modelId] = agentModel.connectionId.split(":", 2);
        if (providerId && modelId) {
          const apiKey = await ctx.services.integrations.getProviderApiKey(
            ctx.resources,
            providerId,
          );
          if (apiKey) {
            const meta = lookupModelMetadata(providerId, modelId);
            return {
              model: createProviderModel(providerId, modelId, apiKey),
              maxInputTokens: meta?.maxInputTokens,
            };
          }
          ctx.log.warn(
            { agentId, providerId, modelId, component: "model" },
            "Agent model API key missing, falling back to default",
          );
        }
      }
    } catch (err) {
      ctx.log.warn(
        { error: (err as Error).message, component: "model" },
        "Failed to resolve agent model, falling back to default",
      );
    }

    // Agent has a model configured but it's not available — fall back
    const fallback = await getModelResult(ctx);
    if (fallback) {
      return {
        ...fallback,
        warning: "Selected model unavailable, using default.",
      };
    }
    throw new Error(
      "No model available. Configure a default model in Integrations.",
    );
  }

  // No agent-specific model — use the system default
  return getModelResult(ctx);
}
