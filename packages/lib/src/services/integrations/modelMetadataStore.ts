import { createRequire } from "node:module";
import type { ModelEntry } from "@gremlin/models";
import type { ModelMode } from "@gremlin/providers";

const require = createRequire(import.meta.url);
const models: Record<
  string,
  ModelEntry
> = require("@gremlin/models/models.json");

/** Modes we surface */
const SURFACED_MODES = new Set<string>(["chat", "image_generation"]);

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

const store = models;

/**
 * Strip the region prefix from a Bedrock inference profile ID.
 * e.g. "us.anthropic.claude-sonnet-4-6" → "anthropic.claude-sonnet-4-6"
 */
function stripBedrockRegionPrefix(modelId: string): string {
  const dot = modelId.indexOf(".");
  if (dot === -1) return modelId;
  const prefix = modelId.slice(0, dot);
  if (/^[a-z]{2,4}$/.test(prefix)) {
    return modelId.slice(dot + 1);
  }
  return modelId;
}

/**
 * Look up a model's metadata in the model store.
 * Tries bare model ID first, then provider-prefixed key.
 * For Bedrock, also tries stripping the region prefix from inference profile IDs.
 */
export function lookupModelMetadata(
  providerId: string,
  modelId: string,
): ModelEntry | null {
  // Try bare ID first (works for OpenAI, Anthropic, Google)
  if (store[modelId]) return store[modelId];

  // Try with provider prefix
  const prefix = PROVIDER_PREFIX[providerId];
  if (prefix) {
    const prefixed = `${prefix}/${modelId}`;
    if (store[prefixed]) return store[prefixed];
  }

  // Bedrock inference profile IDs have a region prefix (e.g. us.anthropic.claude-sonnet-4-6)
  if (providerId === "bedrock") {
    const stripped = stripBedrockRegionPrefix(modelId);
    if (stripped !== modelId && store[stripped]) return store[stripped];
  }

  return null;
}

/**
 * Classify a model using the model store.
 * Returns the ModelMode if the model is found and has a surfaceable mode,
 * or null if the model should be hidden.
 */
export function classifyModelFromStore(
  providerId: string,
  modelId: string,
): ModelMode | null {
  const meta = lookupModelMetadata(providerId, modelId);
  if (!meta) return null;
  return SURFACED_MODES.has(meta.mode) ? (meta.mode as ModelMode) : null;
}
