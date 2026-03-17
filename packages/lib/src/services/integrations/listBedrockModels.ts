import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { ModelDef } from "./providers.js";

const client = new BedrockClient({
  credentials: fromNodeProviderChain(),
});

/** Cache to avoid hammering the API on every request */
let cachedModels: ModelDef[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch available foundation models from AWS Bedrock via ListFoundationModels.
 * Filters to models that support text output (chat/completion models).
 * Results are cached for 5 minutes.
 */
export async function listBedrockModels(): Promise<ModelDef[]> {
  if (cachedModels && Date.now() < cacheExpiry) {
    return cachedModels;
  }

  const resp = await client.send(
    new ListFoundationModelsCommand({
      byOutputModality: "TEXT",
    }),
  );

  const models: ModelDef[] = (resp.modelSummaries ?? [])
    .filter(
      (m): m is typeof m & { modelId: string; modelName: string } =>
        !!m.modelId && !!m.modelName,
    )
    .map((m) => ({
      id: m.modelId,
      name: m.modelName,
      contextWindow: 0,
      maxTokens: 0,
      reasoning: false,
    }));

  // Sort by provider then model name
  models.sort((a, b) => a.id.localeCompare(b.id));

  cachedModels = models;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return models;
}
