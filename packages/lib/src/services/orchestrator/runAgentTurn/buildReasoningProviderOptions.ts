/**
 * Return provider-specific options to opt in to reasoning / extended thinking.
 * Only a subset of providers need explicit opt-in — OpenAI's o1/o3 reason by
 * default and DeepSeek exposes reasoning as a dedicated model, so neither
 * needs anything here.
 */
export function buildReasoningProviderOptions(
  modelProvider: string,
): Record<string, Record<string, unknown>> | undefined {
  // Anthropic: opt-in via thinking config
  if (modelProvider.startsWith("anthropic")) {
    return { anthropic: { thinking: { type: "adaptive" } } };
  }
  // OpenAI reasoning models (o1/o3) reason by default — no extra options needed
  // DeepSeek reasoning is automatic
  // For other providers, no standard reasoning option
  return undefined;
}
