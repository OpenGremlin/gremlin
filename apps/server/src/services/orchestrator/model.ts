import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { LanguageModel } from "ai";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";

const log = createLogger("model");

const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

const BEDROCK_FALLBACK_MODEL = "us.anthropic.claude-sonnet-4-20250514-v1:0";

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
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
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
          const { Item: keyItem } =
            await ctx.resources.ddb.entities.ModelProviderKey.build(
              GetItemCommand,
            )
              .key({ providerId })
              .send();
          if (keyItem) {
            return {
              model: createProviderModel(providerId, modelId, keyItem.apiKey),
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
  const defaultModel = await ctx.services.modelProviders.getDefaultModel(ctx);

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
  const { Item: keyItem } =
    await ctx.resources.ddb.entities.ModelProviderKey.build(GetItemCommand)
      .key({ providerId: defaultModel.providerId })
      .send();

  if (!keyItem) {
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
    keyItem.apiKey,
  );

  cachedModel = model;
  cacheExpiresAt = now + 30_000; // 30s TTL

  return model;
}
