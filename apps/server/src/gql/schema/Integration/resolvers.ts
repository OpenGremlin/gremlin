import type { SafeIntegrationConnection } from "@opengremlin/lib/services/integrations/getConnections.js";
import { buildSpeechUrl } from "@opengremlin/lib/services/speech/signedSpeechUrl.js";
import { GraphQLError } from "graphql";
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

const integrationConnections: QueryResolvers["integrationConnections"] = async (
  _parent,
  { excludeCategory },
  ctx,
) => {
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

const defaultModel: QueryResolvers["defaultModel"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getDefaultModel(ctx);

const defaultImageModel: QueryResolvers["defaultImageModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx, "defaultImageModel");

const defaultSpeechModel: QueryResolvers["defaultSpeechModel"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getDefaultModel(ctx, "defaultSpeechModel");

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

const VOICE_PREVIEW_LINES = [
  "You must construct additional pylons!",
  "The cake is a lie!",
  "It's dangerous to go alone! Take this.",
  "Do a barrel roll!",
  "War. War never changes.",
  "Would you kindly?",
  "Stay a while and listen.",
  "All your base are belong to us.",
  "It's super effective!",
  "What is a man? A miserable little pile of secrets!",
  "You have died of dysentery.",
  "A man chooses. A slave obeys.",
  "Stop right there, criminal scum!",
  "You were almost a Jill sandwich!",
  "Kept you waiting, huh?",
  "You've met with a terrible fate, haven't you?",
  "Did I ever tell you the definition of insanity?",
  "Time is money, friend!",
  "My life for Aiur!",
  "Let me guess, someone stole your sweetroll?",
  "Look behind you, a three-headed monkey!",
  "How about a round of Gwent?",
  "Another settlement needs your help.",
  "Hey cousin, want to go bowling?",
  "Welcome to the circus of value!",
  "Watch those wrist rockets!",
  "Now you're thinking with portals.",
  "Praise the sun! Jolly cooperation!",
  "Not even death can save you from me.",
  "Zug zug! Whatcha want me to do?",
  "Finish him! Fatality!",
  "Hey! Listen! Hey! Watch out!",
  "Boy! Come here, boy. We have work to do.",
  "Let's a-go! Wahoo! Here we go!",
  "Snake? Snake! Snaaake!",
  "Booker, catch! Heads or tails?",
  "Job's done. Off I go then. More work?",
];

const speechVoices: QueryResolvers["speechVoices"] = async (
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
  if (conn.connectionType === "aws_iam_role") {
    return {
      __typename: "AwsIamRoleConnectionMeta" as const,
      accountId: conn.connectionMeta.accountId ?? null,
      roleArn: conn.connectionMeta.roleArn ?? "",
      region: conn.connectionMeta.roleRegion ?? null,
      displayName: conn.connectionMeta.displayName ?? null,
    };
  }
  return {
    __typename: "ApiKeyConnectionMeta" as const,
    accountId: conn.connectionMeta.accountId ?? null,
  };
};

const awsPresetRoles: QueryResolvers["awsPresetRoles"] = (
  _parent,
  _args,
  ctx,
) => ctx.services.integrations.getAwsPresetRoles();

const awsSetupInfo: QueryResolvers["awsSetupInfo"] = (_parent, _args, ctx) => ({
  trustPolicy: ctx.services.integrations.getAwsTrustPolicy(),
});

const connectAwsIamRole: MutationResolvers["connectAwsIamRole"] = async (
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
  async (_parent, { id }, ctx) => {
    // Fetch the connection before revoking so we can return it
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connection = connections.find((c) => c.id === id);
    if (!connection) throw new Error(`Connection not found: ${id}`);
    await ctx.services.integrations.revokeConnection(ctx.resources, id);
    return { ...connection, isRevoked: true };
  };

const setDefaultModel: MutationResolvers["setDefaultModel"] = async (
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
  const result = await ctx.services.integrations.getDefaultModel(
    ctx,
    "defaultImageModel",
  );
  if (!result)
    throw new Error("Failed to retrieve default image model after setting");
  return result;
};

const setDefaultSpeechModel: MutationResolvers["setDefaultSpeechModel"] =
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

const enableModelMutation: MutationResolvers["enableModel"] = async (
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

const disableModelMutation: MutationResolvers["disableModel"] = async (
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

const enableBedrockModel: MutationResolvers["enableBedrockModel"] = async (
  _parent,
  { modelId, modelName },
  ctx,
) => {
  await ctx.services.integrations.enableBedrockModel(
    ctx.resources,
    modelId,
    modelName ?? undefined,
  );
  const models = await ctx.services.integrations.getBedrockEnabledModels(
    ctx.resources,
  );
  return models.map((m) => m.id);
};

const disableBedrockModel: MutationResolvers["disableBedrockModel"] = async (
  _parent,
  { modelId },
  ctx,
) => {
  await ctx.services.integrations.disableBedrockModel(ctx.resources, modelId);
  const models = await ctx.services.integrations.getBedrockEnabledModels(
    ctx.resources,
  );
  return models.map((m) => m.id);
};

const submitOAuthConnection: MutationResolvers["submitOAuthConnection"] =
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
    // Return the full connection object for cache normalization
    const connections = await ctx.services.integrations.getConnections(
      ctx.resources,
    );
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error("Failed to retrieve connection after creation");
    }
    return connection;
  };

export const integrationResolvers = {
  Query: {
    integrationProviders,
    integrationConnections,
    awsPresetRoles,
    awsSetupInfo,
    defaultModel,
    defaultImageModel,
    defaultSpeechModel,
    allEnabledModels,
    enabledModels,
    bedrockEnabledModels,
    bedrockAvailableModels,
    providerModels,
    enabledModelDetails,
    speechVoices,
  },
  Mutation: {
    connectApiKey,
    connectAwsIamRole,
    revokeIntegrationConnection,
    setDefaultModel,
    setDefaultImageModel,
    setDefaultSpeechModel,
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
