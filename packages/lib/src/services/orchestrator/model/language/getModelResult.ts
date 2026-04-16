import type { ServiceContext } from "../../../context.js";
import { lookupModelMetadata } from "../../../integrations/modelMetadataStore.js";
import { BEDROCK_FALLBACK_MODEL, bedrock } from "../bedrockClient.js";
import { getCached, type ModelResult, setCached } from "../cache.js";
import { createProviderModel } from "./createProviderModel.js";

export async function getModelResult(
  ctx: ServiceContext,
): Promise<ModelResult> {
  if (ctx.modelOverride) {
    return {
      model: ctx.modelOverride.model,
      maxInputTokens: ctx.modelOverride.maxInputTokens,
    };
  }

  const cached = getCached();
  if (cached) return cached;

  // Read default model setting
  const defaultModel = await ctx.services.integrations.getDefaultModel(ctx);

  if (!defaultModel) {
    ctx.log.info(
      {
        modelId: BEDROCK_FALLBACK_MODEL,
        reason: "no_default",
        component: "model",
      },
      "Using Bedrock fallback model",
    );
    const meta = lookupModelMetadata("bedrock", BEDROCK_FALLBACK_MODEL);
    return {
      model: bedrock(BEDROCK_FALLBACK_MODEL),
      maxInputTokens: meta?.maxInputTokens,
    };
  }

  ctx.log.info(
    {
      providerId: defaultModel.providerId,
      modelId: defaultModel.modelId,
      component: "model",
    },
    "Resolved default model",
  );

  const meta = lookupModelMetadata(
    defaultModel.providerId,
    defaultModel.modelId,
  );

  if (defaultModel.providerId === "bedrock") {
    const result: ModelResult = {
      model: bedrock(defaultModel.modelId),
      maxInputTokens: meta?.maxInputTokens,
    };
    setCached(result);
    return result;
  }

  const apiKey = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    defaultModel.providerId,
  );

  if (!apiKey) {
    ctx.log.warn(
      {
        providerId: defaultModel.providerId,
        modelId: BEDROCK_FALLBACK_MODEL,
        component: "model",
      },
      "API key missing, falling back to Bedrock",
    );
    const fallbackMeta = lookupModelMetadata("bedrock", BEDROCK_FALLBACK_MODEL);
    return {
      model: bedrock(BEDROCK_FALLBACK_MODEL),
      maxInputTokens: fallbackMeta?.maxInputTokens,
    };
  }

  const result: ModelResult = {
    model: createProviderModel(
      defaultModel.providerId,
      defaultModel.modelId,
      apiKey,
    ),
    maxInputTokens: meta?.maxInputTokens,
  };

  setCached(result);
  return result;
}
