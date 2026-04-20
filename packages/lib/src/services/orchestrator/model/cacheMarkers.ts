export type CacheTTL = "5m" | "1h";

/**
 * Provider-options payload for a cache-marker. Shape matches what the AI SDK
 * re-exports as `ProviderOptions` — a map of providerId → provider-specific
 * option bag.
 */
export type CacheMarkerOptions = Record<string, Record<string, unknown>>;

/**
 * Providers that support explicit prompt-cache breakpoints via
 * `providerOptions`. Everything else (OpenAI, DeepSeek, Google Gemini 2.5+,
 * etc.) either caches automatically or not at all — we pass through for
 * those and rely on whatever the provider does natively.
 *
 * This narrow union makes `cacheMarker`'s switch exhaustive: adding a new
 * variant here triggers a TypeScript error in `cacheMarker` until handled.
 */
export type CacheCapableProvider = "amazon-bedrock" | "anthropic";

/**
 * Normalize a raw AI-SDK `LanguageModel.provider` string to a
 * `CacheCapableProvider`, or null if the provider doesn't support explicit
 * cache breakpoints.
 *
 * The `"bedrock"` alias exists because some test fixtures (and possibly
 * older SDK versions) use that string instead of the canonical
 * `"amazon-bedrock"` reported by `createAmazonBedrock()`.
 */
export function asCacheCapableProvider(
  providerId: string,
): CacheCapableProvider | null {
  if (providerId === "amazon-bedrock" || providerId === "bedrock") {
    return "amazon-bedrock";
  }
  if (providerId === "anthropic") {
    return "anthropic";
  }
  return null;
}

/**
 * Build the provider-options payload for a prompt-cache breakpoint.
 *
 * Anthropic models have a minimum cacheable prompt length (e.g. 2048 tokens
 * for Sonnet 4.6). Attaching a marker to a shorter prompt is harmless but
 * won't actually cache.
 *
 * TTL ordering: when mixing TTLs in a single request, 1h breakpoints must
 * appear before 5m breakpoints. Callers that use both should place the 1h
 * marker on the stable prefix (system) and 5m on the rolling tail.
 */
export function cacheMarker(
  provider: CacheCapableProvider,
  opts?: { ttl?: CacheTTL },
): CacheMarkerOptions {
  const ttl = opts?.ttl ?? "5m";
  switch (provider) {
    case "amazon-bedrock":
      return { bedrock: { cachePoint: { type: "default", ttl } } };
    case "anthropic":
      return { anthropic: { cacheControl: { type: "ephemeral", ttl } } };
  }
}
