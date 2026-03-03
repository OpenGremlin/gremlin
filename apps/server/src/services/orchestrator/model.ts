import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { LanguageModel } from "ai";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";

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

export async function getModel(ctx: ServiceContext): Promise<LanguageModel> {
  const now = Date.now();
  if (cachedModel && now < cacheExpiresAt) {
    return cachedModel;
  }

  // Read active model setting
  const activeModel = await ctx.services.modelProviders.getActiveModel(ctx);

  if (!activeModel) {
    // No active model configured — fall back to Bedrock
    return bedrock(BEDROCK_FALLBACK_MODEL);
  }

  // Fetch the API key for the active provider
  const { Item: keyItem } =
    await ctx.resources.ddb.entities.ModelProviderKey.build(GetItemCommand)
      .key({ providerId: activeModel.providerId })
      .send();

  if (!keyItem) {
    // API key was removed but setting not cleaned up — fall back to Bedrock
    return bedrock(BEDROCK_FALLBACK_MODEL);
  }

  const model = createProviderModel(
    activeModel.providerId,
    activeModel.modelId,
    keyItem.apiKey,
  );

  cachedModel = model;
  cacheExpiresAt = now + 30_000; // 30s TTL

  return model;
}
