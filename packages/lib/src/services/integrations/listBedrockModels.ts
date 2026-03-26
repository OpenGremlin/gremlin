import {
  BedrockClient,
  ListInferenceProfilesCommand,
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

/** Skip image, embedding, video, and other non-text-generation profiles */
const NON_TEXT_PATTERN =
  /stable|upscale|embed|pegasus|marengo|image|recolor|inpaint|outpaint|style-(?:transfer|guide)|erase|sketch|structure|background|replace/i;

/**
 * Fetch available inference profiles from AWS Bedrock via ListInferenceProfiles.
 * Returns cross-region inference profile IDs (e.g. us.anthropic.claude-sonnet-4-6)
 * that can be used directly for model invocation.
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
        p.status === "ACTIVE" &&
        !NON_TEXT_PATTERN.test(p.inferenceProfileId) &&
        !NON_TEXT_PATTERN.test(p.inferenceProfileName)
      ) {
        profiles.push({
          id: p.inferenceProfileId,
          name: p.inferenceProfileName,
        });
      }
    }
    nextToken = resp.nextToken;
  } while (nextToken);

  const models: ModelDef[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    type: "llm",
    contextWindow: 0,
    maxTokens: 0,
    reasoning: false,
  }));

  models.sort((a, b) => a.id.localeCompare(b.id));

  cachedModels = models;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return models;
}
