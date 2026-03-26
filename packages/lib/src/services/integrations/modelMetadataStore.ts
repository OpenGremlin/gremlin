import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModelType } from "@gremlin/providers";
import { createLogger } from "../../logger.js";

const log = createLogger("model-metadata-store");

const REMOTE_URL =
  "https://opengremlin.com/data/litellm/model_prices_and_context_window.json";

/** How long to cache the remote data before re-fetching */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Timeout for the remote fetch */
const FETCH_TIMEOUT_MS = 5000;

export interface ModelMetadata {
  mode: string;
  litellm_provider: string;
  max_input_tokens?: number;
  max_output_tokens?: number;
  max_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_reasoning?: boolean;
  supports_response_schema?: boolean;
  supported_modalities?: string[];
  supported_output_modalities?: string[];
  output_cost_per_image?: number;
}

/** Modes we surface, mapped to our ModelType */
const MODE_TO_TYPE: Record<string, ModelType> = {
  chat: "llm",
  image_generation: "image",
};

/**
 * Map our provider IDs to the prefix LiteLLM uses in its keys.
 * Providers whose models are stored bare (no prefix) map to null.
 */
const PROVIDER_PREFIX: Record<string, string | null> = {
  openai: null,
  anthropic: null,
  google_ai: null,
  bedrock: null,
  xai: "xai",
  deepseek: "deepseek",
  mistral: "mistral",
  groq: "groq",
  perplexity: "perplexity",
  together: "together_ai",
  fireworks: "fireworks_ai",
  cohere: "cohere",
  cohere_chat: "cohere_chat",
  minimax: "minimax",
  qwen: null,
};

let store: Record<string, ModelMetadata> | null = null;
let cacheExpiry = 0;
let fetchInProgress: Promise<void> | null = null;

function parseStore(raw: string): Record<string, ModelMetadata> {
  const data = JSON.parse(raw) as Record<string, ModelMetadata>;
  delete data.sample_spec;
  return data;
}

function loadLocalFallback(): Record<string, ModelMetadata> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const filePath = join(
    currentDir,
    "../../data/model_prices_and_context_window.json",
  );
  const raw = readFileSync(filePath, "utf8");
  return parseStore(raw);
}

async function fetchRemote(): Promise<Record<string, ModelMetadata> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(REMOTE_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      log.warn(`Remote model metadata returned ${res.status}`);
      return null;
    }
    const raw = await res.text();
    return parseStore(raw);
  } catch (err) {
    log.warn(
      `Failed to fetch remote model metadata: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

/**
 * Ensure the store is loaded. Tries remote URL first, falls back to local file.
 * Caches the result for CACHE_TTL_MS.
 */
async function ensureStore(): Promise<Record<string, ModelMetadata>> {
  if (store && Date.now() < cacheExpiry) return store;

  // Avoid concurrent fetches
  if (fetchInProgress) {
    await fetchInProgress;
    if (store) return store;
  }

  fetchInProgress = (async () => {
    const remote = await fetchRemote();
    if (remote) {
      store = remote;
      cacheExpiry = Date.now() + CACHE_TTL_MS;
      log.info("Loaded model metadata from remote URL");
    } else {
      // Remote failed — use local fallback if we have nothing cached,
      // but still retry after CACHE_TTL_MS
      if (!store) {
        store = loadLocalFallback();
        log.info("Loaded model metadata from local fallback");
      }
      cacheExpiry = Date.now() + CACHE_TTL_MS;
    }
  })();

  await fetchInProgress;
  fetchInProgress = null;
  // store is guaranteed non-null after ensureStore logic above
  return store ?? loadLocalFallback();
}

/**
 * Synchronous access to the store. Returns the cached store if available,
 * otherwise loads the local fallback synchronously.
 */
function getStoreSync(): Record<string, ModelMetadata> {
  if (store) return store;
  store = loadLocalFallback();
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return store;
}

/** Invalidate the cached store (useful for testing or when updating the file). */
export function invalidateModelMetadataStore(): void {
  store = null;
  cacheExpiry = 0;
  fetchInProgress = null;
}

/**
 * Pre-load the store from the remote URL (or fallback).
 * Call this at server startup so the first model listing doesn't pay the fetch cost.
 */
export async function preloadModelMetadataStore(): Promise<void> {
  await ensureStore();
}

/**
 * Strip the region prefix from a Bedrock inference profile ID.
 * e.g. "us.anthropic.claude-sonnet-4-6" → "anthropic.claude-sonnet-4-6"
 */
function stripBedrockRegionPrefix(modelId: string): string {
  const dot = modelId.indexOf(".");
  if (dot === -1) return modelId;
  const prefix = modelId.slice(0, dot);
  // Region prefixes are short lowercase alpha strings (us, eu, ap, etc.)
  if (/^[a-z]{2,4}$/.test(prefix)) {
    return modelId.slice(dot + 1);
  }
  return modelId;
}

/**
 * Look up a model's metadata in the LiteLLM store.
 * Tries bare model ID first, then provider-prefixed key.
 * For Bedrock, also tries stripping the region prefix from inference profile IDs.
 */
export function lookupModelMetadata(
  providerId: string,
  modelId: string,
): ModelMetadata | null {
  const data = getStoreSync();

  // Try bare ID first (works for OpenAI, Anthropic, Google)
  if (data[modelId]) return data[modelId];

  // Try with provider prefix
  const prefix = PROVIDER_PREFIX[providerId];
  if (prefix) {
    const prefixed = `${prefix}/${modelId}`;
    if (data[prefixed]) return data[prefixed];
  }

  // Bedrock inference profile IDs have a region prefix (e.g. us.anthropic.claude-sonnet-4-6)
  if (providerId === "bedrock") {
    const stripped = stripBedrockRegionPrefix(modelId);
    if (stripped !== modelId && data[stripped]) return data[stripped];
  }

  return null;
}

/**
 * Classify a model using the LiteLLM store.
 * Returns the ModelType if the model is found and has a surfaceable mode,
 * or null if the model should be hidden.
 */
export function classifyModelFromStore(
  providerId: string,
  modelId: string,
): ModelType | null {
  const meta = lookupModelMetadata(providerId, modelId);
  if (!meta) return null;
  return MODE_TO_TYPE[meta.mode] ?? null;
}
