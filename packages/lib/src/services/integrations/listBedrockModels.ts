import {
  BedrockClient,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { classifyModelFromStore } from "./modelMetadataStore.js";
import type { ModelDef } from "./providers.js";

const client = new BedrockClient({
  credentials: fromNodeProviderChain(),
});

/** Cache to avoid hammering the API on every request */
let cachedModels: ModelDef[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch available inference profiles from AWS Bedrock via ListInferenceProfiles.
 * Returns cross-region inference profile IDs (e.g. us.anthropic.claude-sonnet-4-6)
 * that can be used directly for model invocation.
 * Models are classified using the LiteLLM metadata store.
 * Results are cached for 5 minutes.
 */
export async function listBedrockModels(): Promise<ModelDef[]> {
  if (cachedModels && Date.now() < cacheExpiry) {
    return cachedModels;
  }

  const profiles: { id: string; name: string }[] = [];
  let nextToken: string | undefined;

  do {
    const resp = await client.send(
      new ListInferenceProfilesCommand({ maxResults: 100, nextToken }),
    );
    for (const p of resp.inferenceProfileSummaries ?? []) {
      if (
        p.inferenceProfileId &&
        p.inferenceProfileName &&
        p.status === "ACTIVE"
      ) {
        profiles.push({
          id: p.inferenceProfileId,
          name: p.inferenceProfileName,
        });
      }
    }
    nextToken = resp.nextToken;
  } while (nextToken);

  const models: ModelDef[] = [];
  for (const p of profiles) {
    const mode = classifyModelFromStore("bedrock", p.id);
    if (mode) {
      models.push({ id: p.id, name: p.name, mode });
    }
  }

  models.sort((a, b) => a.id.localeCompare(b.id));

  cachedModels = models;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return models;
}
