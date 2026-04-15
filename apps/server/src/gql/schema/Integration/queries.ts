import { buildSpeechUrl } from "@opengremlin/lib/services/speech/signedSpeechUrl.js";
import type { QueryResolvers } from "../../resolverTypes.js";
import { VOICE_PREVIEW_LINES } from "./voicePreviewLines.js";

export const integrationProviders: QueryResolvers["integrationProviders"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getIntegrations();

export const integrationConnections: QueryResolvers["integrationConnections"] =
  async (_parent, { excludeCategory }, ctx) => {
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    if (!excludeCategory) return connections;
    const providers = ctx.services.integrations.getIntegrations();
    const excludedIds = new Set(
      providers.filter((p) => p.category === excludeCategory).map((p) => p.id),
    );
    return connections.filter((c) => !excludedIds.has(c.providerId));
  };

export const defaultModel: QueryResolvers["defaultModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx);

export const defaultImageModel: QueryResolvers["defaultImageModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx, "defaultImageModel");

export const defaultSpeechModel: QueryResolvers["defaultSpeechModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx, "defaultSpeechModel");

export const allEnabledModels: QueryResolvers["allEnabledModels"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getAllEnabledModels(ctx.resources);

export const enabledModels: QueryResolvers["enabledModels"] = async (
  _parent,
  { providerId },
  ctx,
) => {
  const models = await ctx.services.integrations.getEnabledModels(
    ctx.resources,
    providerId,
  );
  return models.map((m) => m.id);
};

export const enabledModelDetails: QueryResolvers["enabledModelDetails"] =
  async (_parent, { providerId }, ctx) => {
    const models = await ctx.services.integrations.getEnabledModels(
      ctx.resources,
      providerId,
    );
    return models;
  };

export const providerModels: QueryResolvers["providerModels"] = async (
  _parent,
  { providerId },
  ctx,
) => {
  // Bedrock uses server-side AWS credentials, no API key needed
  if (providerId === "bedrock") {
    return ctx.services.integrations.listBedrockModels();
  }
  const apiKey = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    providerId,
  );
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${providerId}`);
  }
  return ctx.services.integrations.listProviderModels(providerId, apiKey);
};

export const speechVoices: QueryResolvers["speechVoices"] = async (
  _parent,
  { connectionId },
  ctx,
) => {
  const [providerId] = connectionId.split(":", 2);
  const apiKey = await ctx.services.integrations
    .getProviderApiKey(ctx.resources, providerId)
    .catch(() => null);
  const voices = await ctx.services.integrations.listProviderVoices(
    providerId,
    apiKey ?? undefined,
  );

  // For voices without a previewUrl, generate one via the TTS endpoint
  return voices.map((v) => {
    if (v.previewUrl) return v;
    return {
      ...v,
      previewUrl: buildSpeechUrl(ctx.serverBaseUrl, {
        text: VOICE_PREVIEW_LINES[
          Math.floor(Math.random() * VOICE_PREVIEW_LINES.length)
        ],
        voice: v.id,
        connectionId,
      }),
    };
  });
};

export const awsPresetRoles: QueryResolvers["awsPresetRoles"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getAwsPresetRoles();

export const awsSetupInfo: QueryResolvers["awsSetupInfo"] = (
  _parent,
  _args,
  ctx,
) => ({
  trustPolicy: ctx.services.integrations.getAwsTrustPolicy(),
});
