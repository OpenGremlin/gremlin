import type {
  IntegrationProviderResolvers,
  IntegrationConnectionResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";
import type { SafeIntegrationConnection } from "../../../services/integrations/getConnections.js";

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

const activeModel: QueryResolvers["activeModel"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getActiveModel(ctx);

const connectionCount: IntegrationProviderResolvers["connectionCount"] =
  async (parent, _args, ctx) => {
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    return connections.filter((c) => c.providerId === parent.id).length;
  };

const hasConnection: IntegrationProviderResolvers["hasConnection"] =
  async (parent, _args, ctx) => {
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

const connectIntegration: MutationResolvers["connectIntegration"] = (
  _parent,
  { providerId, scopes },
  ctx,
) => ctx.services.integrations.connectIntegration(ctx, providerId, scopes);

const connectApiKey: MutationResolvers["connectApiKey"] = (
  _parent,
  { providerId, apiKey },
  ctx,
) => ctx.services.integrations.connectApiKey(ctx.resources, providerId, apiKey);

const renameIntegrationConnection: MutationResolvers["renameIntegrationConnection"] =
  (_parent, { id, description }, ctx) =>
    ctx.services.integrations.renameConnection(ctx.resources, id, description);

const revokeIntegrationConnection: MutationResolvers["revokeIntegrationConnection"] =
  (_parent, { id }, ctx) =>
    ctx.services.integrations.revokeConnection(ctx.resources, id);

const setActiveModel: MutationResolvers["setActiveModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  await ctx.services.integrations.setActiveModel(ctx, providerId, modelId);
  return true;
};

export const integrationResolvers = {
  Query: { integrationProviders, integrationConnections, activeModel },
  Mutation: {
    connectIntegration,
    connectApiKey,
    renameIntegrationConnection,
    revokeIntegrationConnection,
    setActiveModel,
  },
  IntegrationProvider: { connectionCount, hasConnection },
  IntegrationConnection: { meta },
  ConnectionMeta: {
    __resolveType(obj: { __typename: string }) {
      return obj.__typename;
    },
  },
};
