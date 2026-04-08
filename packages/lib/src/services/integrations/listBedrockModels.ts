import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
} from "@aws-sdk/client-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { createLogger } from "../../logger.js";
import { classifyModelFromStore } from "./modelMetadataStore.js";
import type { ModelDef } from "./providers.js";

const log = createLogger("integrations:bedrock");

const client = new BedrockClient({
  credentials: fromNodeProviderChain(),
});

/** Cache to avoid hammering the API on every request */
let cachedModels: ModelDef[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type Candidate = { id: string; name: string };

async function fetchInferenceProfiles(): Promise<Candidate[]> {
  const out: Candidate[] = [];
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
        out.push({ id: p.inferenceProfileId, name: p.inferenceProfileName });
      }
    }
    nextToken = resp.nextToken;
  } while (nextToken);
  return out;
}

async function fetchFoundationModels(): Promise<Candidate[]> {
  // Foundation models cover image/audio modalities (Nova Canvas, Titan Image,
  // Stable Diffusion, Nova Sonic, etc.) which are not exposed as inference
  // profiles. ListFoundationModels does not paginate.
  const resp = await client.send(new ListFoundationModelsCommand({}));
  const out: Candidate[] = [];
  for (const m of resp.modelSummaries ?? []) {
    if (!m.modelId || !m.modelName) continue;
    if (m.modelLifecycle?.status && m.modelLifecycle.status !== "ACTIVE") {
      continue;
    }
    // Only models that can be invoked directly on-demand.
    if (
      m.inferenceTypesSupported &&
      m.inferenceTypesSupported.length > 0 &&
      !m.inferenceTypesSupported.includes("ON_DEMAND")
    ) {
      continue;
    }
    out.push({ id: m.modelId, name: m.modelName });
  }
  return out;
}

/**
 * Fetch available models from AWS Bedrock.
 *
 * Combines two sources:
 *  - ListInferenceProfiles: cross-region profile IDs for chat LLMs (e.g.
 *    us.anthropic.claude-sonnet-4-6).
 *  - ListFoundationModels: direct foundation model IDs, which is the only way
 *    to discover image and audio models (Nova Canvas, Titan Image, Stable
 *    Diffusion, Nova Sonic, etc.).
 *
 * Models are classified using the LiteLLM metadata store. Results are cached
 * for 5 minutes.
 */
export async function listBedrockModels(): Promise<ModelDef[]> {
  if (cachedModels && Date.now() < cacheExpiry) {
    return cachedModels;
  }

  const [profilesResult, foundationsResult] = await Promise.allSettled([
    fetchInferenceProfiles(),
    fetchFoundationModels(),
  ]);

  const candidates = new Map<string, Candidate>();

  if (profilesResult.status === "fulfilled") {
    for (const c of profilesResult.value) candidates.set(c.id, c);
  } else {
    log.warn(
      { err: profilesResult.reason },
      "ListInferenceProfiles failed; continuing with foundation models only",
    );
  }

  if (foundationsResult.status === "fulfilled") {
    for (const c of foundationsResult.value) {
      // Inference profile entries take precedence (better names, region-aware).
      if (!candidates.has(c.id)) candidates.set(c.id, c);
    }
  } else {
    log.warn(
      { err: foundationsResult.reason },
      "ListFoundationModels failed; image/audio models will not appear",
    );
  }

  if (candidates.size === 0) {
    // Both calls failed — surface the inference-profile error if present.
    if (profilesResult.status === "rejected") throw profilesResult.reason;
    if (foundationsResult.status === "rejected") throw foundationsResult.reason;
  }

  const models: ModelDef[] = [];
  for (const c of candidates.values()) {
    const mode = classifyModelFromStore("bedrock", c.id);
    if (mode) {
      models.push({ id: c.id, name: c.name, mode });
    }
  }

  models.sort((a, b) => a.id.localeCompare(b.id));

  cachedModels = models;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return models;
}
