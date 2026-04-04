import { createAlibaba } from "@ai-sdk/alibaba";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createFireworks } from "@ai-sdk/fireworks";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createXai } from "@ai-sdk/xai";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { ImageModel, LanguageModel, SpeechModel } from "ai";
import { createMinimax } from "vercel-minimax-ai-provider";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { lookupModelMetadata } from "../integrations/modelMetadataStore.js";

const log = createLogger("model");

const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

const BEDROCK_FALLBACK_MODEL = "us.anthropic.claude-sonnet-4-6";

// ── 30s TTL cache ────────────────────────────────────────
let cachedResult: ModelResult | null = null;
let cacheExpiresAt = 0;

export function invalidateModelCache(): void {
  cachedResult = null;
  cacheExpiresAt = 0;
}

function createProviderModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): LanguageModel {
  switch (providerId) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
    case "google_ai": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "xai": {
      const xai = createXai({ apiKey });
      return xai(modelId);
    }
    case "mistral": {
      const mistral = createMistral({ apiKey });
      return mistral(modelId);
    }
    case "deepseek": {
      const deepseek = createDeepSeek({ apiKey });
      return deepseek(modelId);
    }
    case "groq": {
      const groq = createGroq({ apiKey });
      return groq(modelId);
    }
    case "perplexity": {
      const perplexity = createPerplexity({ apiKey });
      return perplexity(modelId);
    }
    case "together": {
      const together = createTogetherAI({ apiKey });
      return together(modelId);
    }
    case "fireworks": {
      const fireworks = createFireworks({ apiKey });
      return fireworks(modelId);
    }
    case "cohere": {
      const cohere = createCohere({ apiKey });
      return cohere(modelId);
    }
    case "minimax": {
      const minimax = createMinimax({ apiKey });
      return minimax(modelId);
    }
    case "qwen": {
      const alibaba = createAlibaba({ apiKey });
      return alibaba(modelId);
    }
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export interface ModelResult {
  model: LanguageModel;
  maxInputTokens?: number;
  warning?: string;
}

/**
 * Resolve the model for a specific agent. Checks the agent's configured model
 * first, falls back to the system default, then to Bedrock.
 */
export async function getModelForAgent(
  ctx: ServiceContext,
  agentId: string,
): Promise<ModelResult> {
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
          log.warn(
            { agentId, providerId, modelId },
            "Agent model API key missing, falling back to default",
          );
        }
      }
    } catch (err) {
      log.warn(
        { error: (err as Error).message },
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

async function getModelResult(ctx: ServiceContext): Promise<ModelResult> {
  const now = Date.now();
  if (cachedResult && now < cacheExpiresAt) {
    return cachedResult;
  }

  // Read default model setting
  const defaultModel = await ctx.services.integrations.getDefaultModel(ctx);

  if (!defaultModel) {
    log.info(
      { modelId: BEDROCK_FALLBACK_MODEL, reason: "no_default" },
      "Using Bedrock fallback model",
    );
    const meta = lookupModelMetadata("bedrock", BEDROCK_FALLBACK_MODEL);
    return {
      model: bedrock(BEDROCK_FALLBACK_MODEL),
      maxInputTokens: meta?.maxInputTokens,
    };
  }

  log.info(
    { providerId: defaultModel.providerId, modelId: defaultModel.modelId },
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
    cachedResult = result;
    cacheExpiresAt = Date.now() + 30_000;
    return result;
  }

  const apiKey = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    defaultModel.providerId,
  );

  if (!apiKey) {
    log.warn(
      { providerId: defaultModel.providerId, modelId: BEDROCK_FALLBACK_MODEL },
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

  cachedResult = result;
  cacheExpiresAt = Date.now() + 30_000;

  return result;
}

export async function getModel(ctx: ServiceContext): Promise<LanguageModel> {
  const result = await getModelResult(ctx);
  return result.model;
}

// ── Image model resolution ───────────────────────────────────────────

function createProviderImageModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): ImageModel {
  switch (providerId) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai.image(modelId);
    }
    case "google_ai": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google.image(modelId);
    }
    case "xai": {
      const xai = createXai({ apiKey });
      return xai.image(modelId);
    }
    case "together": {
      const together = createTogetherAI({ apiKey });
      return together.image(modelId);
    }
    case "fireworks": {
      const fireworks = createFireworks({ apiKey });
      return fireworks.image(modelId);
    }
    default:
      throw new Error(
        `Image generation not supported for provider: ${providerId}`,
      );
  }
}

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
      log.warn(
        { error: (err as Error).message },
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
    log.warn(
      { error: (err as Error).message },
      "Failed to resolve default image model",
    );
    return null;
  }
}

// ── Speech model resolution ─────────────────────────────────────────

function createProviderSpeechModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): SpeechModel {
  switch (providerId) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai.speech(modelId);
    }
    default:
      throw new Error(
        `Speech generation not supported for provider: ${providerId}`,
      );
  }
}

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
      log.warn(
        { error: (err as Error).message },
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
    log.warn(
      { error: (err as Error).message },
      "Failed to resolve default speech model",
    );
    return null;
  }
}
