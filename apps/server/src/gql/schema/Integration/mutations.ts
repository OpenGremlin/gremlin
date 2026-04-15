import { GraphQLError } from "graphql";
import type { MutationResolvers } from "../../resolverTypes.js";

export const connectAwsIamRole: MutationResolvers["connectAwsIamRole"] = async (
  _parent,
  { roleArn, displayName, region },
  ctx,
) => {
  const connectionId = await ctx.services.integrations.connectAwsIamRole(
    ctx.resources,
    roleArn,
    displayName ?? undefined,
    region ?? undefined,
  );
  const connections = await ctx.services.integrations.getConnections(
    ctx.resources,
  );
  const connection = connections.find((c) => c.id === connectionId);
  if (!connection)
    throw new Error("Failed to retrieve connection after creation");
  return connection;
};

export const connectApiKey: MutationResolvers["connectApiKey"] = async (
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

export const revokeIntegrationConnection: MutationResolvers["revokeIntegrationConnection"] =
  async (_parent, { id }, ctx) => {
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connection = connections.find((c) => c.id === id);
    if (!connection) throw new Error(`Connection not found: ${id}`);
    await ctx.services.integrations.revokeConnection(ctx.resources, id);
    return { ...connection, isRevoked: true };
  };

export const setDefaultModel: MutationResolvers["setDefaultModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  await ctx.services.integrations.setDefaultModel(ctx, providerId, modelId);
  const result = await ctx.services.integrations.getDefaultModel(ctx);
  if (!result)
    throw new Error("Failed to retrieve default model after setting");
  return result;
};

export const setDefaultImageModel: MutationResolvers["setDefaultImageModel"] =
  async (_parent, { providerId, modelId }, ctx) => {
    await ctx.services.integrations.setDefaultModel(
      ctx,
      providerId,
      modelId,
      "defaultImageModel",
    );
    const result = await ctx.services.integrations.getDefaultModel(
      ctx,
      "defaultImageModel",
    );
    if (!result)
      throw new Error("Failed to retrieve default image model after setting");
    return result;
  };

export const setDefaultSpeechModel: MutationResolvers["setDefaultSpeechModel"] =
  async (_parent, { providerId, modelId }, ctx) => {
    await ctx.services.integrations.setDefaultModel(
      ctx,
      providerId,
      modelId,
      "defaultSpeechModel",
    );
    const result = await ctx.services.integrations.getDefaultModel(
      ctx,
      "defaultSpeechModel",
    );
    if (!result)
      throw new Error("Failed to retrieve default speech model after setting");
    return result;
  };

export const enableModelMutation: MutationResolvers["enableModel"] = async (
  _parent,
  { providerId, modelId, modelName },
  ctx,
) => {
  await ctx.services.integrations.enableModel(
    ctx.resources,
    providerId,
    modelId,
    modelName ?? undefined,
  );
  const models = await ctx.services.integrations.getEnabledModels(
    ctx.resources,
    providerId,
  );
  return models.map((m) => ({
    providerId,
    modelId: m.id,
    modelName: m.name,
    modelMode: m.mode,
  }));
};

export const disableModelMutation: MutationResolvers["disableModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  try {
    await ctx.services.integrations.disableModel(
      ctx.resources,
      providerId,
      modelId,
    );
    const models = await ctx.services.integrations.getEnabledModels(
      ctx.resources,
      providerId,
    );
    return models.map((m) => ({
      providerId,
      modelId: m.id,
      modelName: m.name,
      modelMode: m.mode,
    }));
  } catch (err) {
    throw new GraphQLError(
      err instanceof Error ? err.message : "Failed to disable model",
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }
};

export const submitOAuthConnection: MutationResolvers["submitOAuthConnection"] =
  async (
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
  ) => {
    const connectionId = await ctx.services.integrations.submitOAuthConnection(
      ctx.resources,
      providerId,
      accessToken,
      refreshToken ?? undefined,
      expiresAt ?? undefined,
      scopes,
      accountId ?? undefined,
      clientId ?? undefined,
    );
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error("Failed to retrieve connection after creation");
    }
    return connection;
  };
