import type { ServiceContext } from "../../../context.js";

/**
 * Resolve the speech model connection ID string (e.g. "openai:tts-1").
 * Checks agent-specific config first, then falls back to the system default.
 */
export async function getSpeechConnectionId(
  ctx: ServiceContext,
  speechModelConfig:
    | { type: string; modelId?: string; connectionId?: string }
    | undefined
    | null,
): Promise<string | null> {
  if (
    speechModelConfig?.type === "connection" &&
    speechModelConfig.connectionId
  ) {
    return speechModelConfig.connectionId;
  }
  const defaultModel = await ctx.services.integrations
    .getDefaultModel(ctx, "defaultSpeechModel")
    .catch(() => null);
  if (defaultModel) {
    return `${defaultModel.providerId}:${defaultModel.modelId}`;
  }
  return null;
}
