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
import type { LanguageModel } from "ai";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";

const log = createLogger("model");

const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

const BEDROCK_FALLBACK_MODEL = "us.anthropic.claude-sonnet-4-6";

// ── 30s TTL cache ────────────────────────────────────────
let cachedModel: LanguageModel | null = null;
let cacheExpiresAt = 0;

export function invalidateModelCache(): void {
  cachedModel = null;
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
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export interface ModelResult {
  model: LanguageModel;
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
        return { model: bedrock(agentModel.modelId) };
      }
      if (agentModel.type === "connection" && agentModel.connectionId) {
        const [providerId, modelId] = agentModel.connectionId.split(":", 2);
        if (providerId && modelId) {
          const apiKey = await ctx.services.integrations.getProviderApiKey(
            ctx.resources,
            providerId,
          );
          if (apiKey) {
            return {
              model: createProviderModel(providerId, modelId, apiKey),
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
        { agentId, error: (err as Error).message },
        "Failed to resolve agent model, falling back to default",
      );
    }

    // Agent has a model configured but it's not available — fall back
    const fallback = await getModel(ctx);
    if (fallback) {
      return {
        model: fallback,
        warning: "Selected model unavailable, using default.",
      };
    }
    throw new Error(
      "No model available. Configure a default model in Integrations.",
    );
  }

  // No agent-specific model — use the system default
  return { model: await getModel(ctx) };
}

export async function getModel(ctx: ServiceContext): Promise<LanguageModel> {
  const now = Date.now();
  if (cachedModel && now < cacheExpiresAt) {
    return cachedModel;
  }

  // Read default model setting
  const defaultModel = await ctx.services.integrations.getDefaultModel(ctx);

  if (!defaultModel) {
    // No default model configured — fall back to Bedrock
    log.info(
      { modelId: BEDROCK_FALLBACK_MODEL, reason: "no_default" },
      "Using Bedrock fallback model",
    );
    return bedrock(BEDROCK_FALLBACK_MODEL);
  }

  log.info(
    { providerId: defaultModel.providerId, modelId: defaultModel.modelId },
    "Resolved default model",
  );

  // Bedrock provider uses server-side credentials — no API key needed
  if (defaultModel.providerId === "bedrock") {
    const model = bedrock(defaultModel.modelId);
    cachedModel = model;
    cacheExpiresAt = now + 30_000;
    return model;
  }

  // Fetch the API key for the default provider
  const apiKey = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    defaultModel.providerId,
  );

  if (!apiKey) {
    // API key was removed but setting not cleaned up — fall back to Bedrock
    log.warn(
      { providerId: defaultModel.providerId, modelId: BEDROCK_FALLBACK_MODEL },
      "API key missing, falling back to Bedrock",
    );
    return bedrock(BEDROCK_FALLBACK_MODEL);
  }

  const model = createProviderModel(
    defaultModel.providerId,
    defaultModel.modelId,
    apiKey,
  );

  cachedModel = model;
  cacheExpiresAt = now + 30_000; // 30s TTL

  return model;
}
