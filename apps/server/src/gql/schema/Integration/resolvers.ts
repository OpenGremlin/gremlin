import type { SafeIntegrationConnection } from "@gremlin/lib/services/integrations/getConnections.js";
import type { GremlinContext } from "../../context.js";
import type {
  IntegrationConnectionResolvers,
  IntegrationProviderResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

// Per-request cache for connections to avoid repeated DynamoDB scans
// when resolving connectionCount + hasConnection across multiple providers.
// Keyed on ctx (created fresh per request), NOT ctx.resources (a singleton).
const connectionsCache = new WeakMap<
  object,
  Promise<SafeIntegrationConnection[]>
>();

function getConnectionsCached(
  ctx: GremlinContext,
): Promise<SafeIntegrationConnection[]> {
  let cached = connectionsCache.get(ctx);
  if (!cached) {
    cached = ctx.services.integrations.getConnections(ctx.resources);
    connectionsCache.set(ctx, cached);
  }
  return cached;
}

const integrationProviders: QueryResolvers["integrationProviders"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getIntegrations();

const integrationConnections: QueryResolvers["integrationConnections"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getConnections(ctx.resources);

const defaultModel: QueryResolvers["defaultModel"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getDefaultModel(ctx);

const defaultImageModel: QueryResolvers["defaultImageModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx, "defaultImageModel");

const allEnabledModels: QueryResolvers["allEnabledModels"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getAllEnabledModels(ctx.resources);

const enabledModels: QueryResolvers["enabledModels"] = async (
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

const bedrockEnabledModels: QueryResolvers["bedrockEnabledModels"] = async (
  _parent,
  _args,
  ctx,
) => {
  const models = await ctx.services.integrations.getBedrockEnabledModels(
    ctx.resources,
  );
  return models.map((m) => m.id);
};

const bedrockAvailableModels: QueryResolvers["bedrockAvailableModels"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.listBedrockModels();

const enabledModelDetails: QueryResolvers["enabledModelDetails"] = async (
  _parent,
  { providerId },
  ctx,
) => {
  const models = await ctx.services.integrations.getEnabledModels(
    ctx.resources,
    providerId,
  );
  return models;
};

const providerModels: QueryResolvers["providerModels"] = async (
  _parent,
  { providerId },
  ctx,
) => {
  const apiKey = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    providerId,
  );
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${providerId}`);
  }
  return ctx.services.integrations.listProviderModels(providerId, apiKey);
};

const connectionCount: IntegrationProviderResolvers["connectionCount"] = async (
  parent,
  _args,
  ctx,
) => {
  const connections = await getConnectionsCached(ctx);
  return connections.filter((c) => c.providerId === parent.id).length;
};

const hasConnection: IntegrationProviderResolvers["hasConnection"] = async (
  parent,
  _args,
  ctx,
) => {
  // Bedrock uses server-side AWS credentials — always connected
  if (parent.connectionType === "bedrock") return true;
  const connections = await getConnectionsCached(ctx);
  return connections.some((c) => c.providerId === parent.id);
};

const provider: IntegrationConnectionResolvers["provider"] = (
  parent,
  _args,
  ctx,
) => {
  const match = ctx.services.integrations
    .getIntegrations()
    .find((p) => p.id === parent.providerId);
  if (!match) throw new Error(`Unknown provider: ${parent.providerId}`);
  return match;
};

const meta: IntegrationConnectionResolvers["meta"] = (parent) => {
  const conn = parent as unknown as SafeIntegrationConnection;
  if (conn.connectionType === "oauth") {
    return {
      __typename: "OAuthConnectionMeta" as const,
      accountId: conn.connectionMeta.accountId ?? null,
      scopes: conn.connectionMeta.scopes?.split(",").filter(Boolean) ?? [],
      expiresAt: conn.connectionMeta.expiresAt ?? null,
    };
  }
  return {
    __typename: "ApiKeyConnectionMeta" as const,
    accountId: conn.connectionMeta.accountId ?? null,
  };
};

const connectApiKey: MutationResolvers["connectApiKey"] = async (
  _parent,
  { providerId, apiKey },
  ctx,
) => {
  const result = await ctx.services.integrations.connectApiKey(
    ctx.resources,
    providerId,
    apiKey,
  );
  return result;
};

const revokeIntegrationConnection: MutationResolvers["revokeIntegrationConnection"] =
  (_parent, { id }, ctx) =>
    ctx.services.integrations.revokeConnection(ctx.resources, id);

const setDefaultModel: MutationResolvers["setDefaultModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  await ctx.services.integrations.setDefaultModel(ctx, providerId, modelId);
  return true;
};

const setDefaultImageModel: MutationResolvers["setDefaultImageModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  await ctx.services.integrations.setDefaultModel(
    ctx,
    providerId,
    modelId,
    "defaultImageModel",
  );
  return true;
};

const enableModelMutation: MutationResolvers["enableModel"] = async (
  _parent,
  { providerId, modelId, modelName },
  ctx,
) =>
  ctx.services.integrations.enableModel(
    ctx.resources,
    providerId,
    modelId,
    modelName ?? undefined,
  );

const disableModelMutation: MutationResolvers["disableModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => ctx.services.integrations.disableModel(ctx.resources, providerId, modelId);

const enableBedrockModel: MutationResolvers["enableBedrockModel"] = async (
  _parent,
  { modelId, modelName },
  ctx,
) =>
  ctx.services.integrations.enableBedrockModel(
    ctx.resources,
    modelId,
    modelName ?? undefined,
  );

const disableBedrockModel: MutationResolvers["disableBedrockModel"] = async (
  _parent,
  { modelId },
  ctx,
) => ctx.services.integrations.disableBedrockModel(ctx.resources, modelId);

const submitOAuthConnection: MutationResolvers["submitOAuthConnection"] = (
  _parent,
  {
    providerId,
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    accountId,
    clientId,
  },
  ctx,
) =>
  ctx.services.integrations.submitOAuthConnection(
    ctx.resources,
    providerId,
    accessToken,
    refreshToken ?? undefined,
    expiresAt ?? undefined,
    scopes,
    accountId ?? undefined,
    clientId ?? undefined,
  );

export const integrationResolvers = {
  Query: {
    integrationProviders,
    integrationConnections,
    defaultModel,
    defaultImageModel,
    allEnabledModels,
    enabledModels,
    bedrockEnabledModels,
    bedrockAvailableModels,
    providerModels,
    enabledModelDetails,
  },
  Mutation: {
    connectApiKey,
    revokeIntegrationConnection,
    setDefaultModel,
    setDefaultImageModel,
    enableModel: enableModelMutation,
    disableModel: disableModelMutation,
    enableBedrockModel,
    disableBedrockModel,
    submitOAuthConnection,
  },
  IntegrationProvider: {
    connectionCount,
    hasConnection,
    extraAuthParams: (parent: { extraAuthParams?: Record<string, string> }) =>
      parent.extraAuthParams ? JSON.stringify(parent.extraAuthParams) : null,
    userInfo: (parent: { userInfo?: unknown }) =>
      parent.userInfo ? JSON.stringify(parent.userInfo) : null,
  },
  IntegrationConnection: { provider, meta },
  ConnectionMeta: {
    __resolveType(obj: { __typename: string }) {
      return obj.__typename;
    },
  },
};
