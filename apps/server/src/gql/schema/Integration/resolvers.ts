import type { SafeIntegrationConnection } from "@gremlin/lib/services/integrations/getConnections.js";
import type {
  IntegrationConnectionResolvers,
  IntegrationProviderResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

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

const bedrockEnabledModels: QueryResolvers["bedrockEnabledModels"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getBedrockEnabledModels(ctx.resources);

const connectionCount: IntegrationProviderResolvers["connectionCount"] = async (
  parent,
  _args,
  ctx,
) => {
  const connections = await ctx.services.integrations.getConnections(
    ctx.resources,
  );
  return connections.filter((c) => c.providerId === parent.id).length;
};

const hasConnection: IntegrationProviderResolvers["hasConnection"] = async (
  parent,
  _args,
  ctx,
) => {
  // Bedrock uses server-side AWS credentials — always connected
  if (parent.connectionType === "bedrock") return true;
  const connections = await ctx.services.integrations.getConnections(
    ctx.resources,
  );
  return connections.some((c) => c.providerId === parent.id);
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

const connectApiKey: MutationResolvers["connectApiKey"] = (
  _parent,
  { providerId, apiKey },
  ctx,
) => ctx.services.integrations.connectApiKey(ctx.resources, providerId, apiKey);

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

const enableBedrockModel: MutationResolvers["enableBedrockModel"] = async (
  _parent,
  { modelId },
  ctx,
) => ctx.services.integrations.enableBedrockModel(ctx.resources, modelId);

const disableBedrockModel: MutationResolvers["disableBedrockModel"] = async (
  _parent,
  { modelId },
  ctx,
) => ctx.services.integrations.disableBedrockModel(ctx.resources, modelId);

const submitOAuthConnection: MutationResolvers["submitOAuthConnection"] = (
  _parent,
  { providerId, accessToken, refreshToken, expiresAt, scopes, accountId },
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
  );

export const integrationResolvers = {
  Query: {
    integrationProviders,
    integrationConnections,
    defaultModel,
    bedrockEnabledModels,
  },
  Mutation: {
    connectApiKey,
    revokeIntegrationConnection,
    setDefaultModel,
    enableBedrockModel,
    disableBedrockModel,
    submitOAuthConnection,
  },
  IntegrationProvider: { connectionCount, hasConnection },
  IntegrationConnection: { meta },
  ConnectionMeta: {
    __resolveType(obj: { __typename: string }) {
      return obj.__typename;
    },
  },
};
