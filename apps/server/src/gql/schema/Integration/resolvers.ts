import {
  connectApiKey,
  connectAwsIamRole,
  disableModelMutation,
  enableModelMutation,
  revokeIntegrationConnection,
  setDefaultImageModel,
  setDefaultModel,
  setDefaultSpeechModel,
  submitOAuthConnection,
} from "./mutations.js";
import {
  allEnabledModels,
  awsPresetRoles,
  awsSetupInfo,
  defaultImageModel,
  defaultModel,
  defaultSpeechModel,
  enabledModelDetails,
  enabledModels,
  integrationConnections,
  integrationProviders,
  providerModels,
  speechVoices,
} from "./queries.js";
import {
  connectionCount,
  hasConnection,
  meta,
  provider,
} from "./typeResolvers.js";

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
