import type { LanguageModel } from "ai";

export interface ModelResult {
  model: LanguageModel;
  maxInputTokens?: number;
  warning?: string;
}

// ── 30s TTL cache ────────────────────────────────────────
let cachedResult: ModelResult | null = null;
let cacheExpiresAt = 0;

const TTL_MS = 30_000;

export function getCached(): ModelResult | null {
  if (cachedResult && Date.now() < cacheExpiresAt) return cachedResult;
  return null;
}

export function setCached(result: ModelResult): void {
  cachedResult = result;
  cacheExpiresAt = Date.now() + TTL_MS;
}

export function invalidateModelCache(): void {
  cachedResult = null;
  cacheExpiresAt = 0;
}
