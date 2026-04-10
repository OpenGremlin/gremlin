export const integrationTypeDefs = /* GraphQL */ `
  type AvailableScope {
    scope: String!
    label: String!
  }

  type ModelInfo {
    id: ID!
    name: String!
    mode: String!
    maxInputTokens: Int
    inputCostPerToken: Float
    outputCostPerToken: Float
    supportedModalities: [String!]
    supportedOutputModalities: [String!]
    inputCostPerImage: Float
    inputCostPerImageToken: Float
    outputCostPerImage: Float
    outputCostPerImageToken: Float
    supportsReasoning: Boolean
  }

  type SpeechVoice {
    id: String!
    name: String!
    description: String
    previewUrl: String
  }

  type DefaultModel {
    providerId: String!
    modelId: String!
    modelName: String
  }

  type ProviderModelInfo {
    id: ID!
    name: String!
    mode: String!
  }

  type EnabledModelEntry {
    providerId: String!
    modelId: String!
    modelName: String
    modelMode: String!
  }

  type ConnectApiKeyResult {
    connectionId: ID!
    models: [ProviderModelInfo!]!
  }

  type OAuthPlatformOverride {
    clientId: String!
    redirectUri: String!
  }

  type IntegrationProvider {
    id: ID!
    service: String!
    category: String!
    description: String!
    connectionType: String!
    availableScopes: [AvailableScope!]!
    models: [ModelInfo!]
    connectionCount: Int!
    hasConnection: Boolean!
    authorizeUrl: String
    tokenUrl: String
    defaultClientId: String
    defaultScopes: [String!]
    scopePrefix: String
    extraAuthParams: String
    userInfo: String
    ios: OAuthPlatformOverride
    android: OAuthPlatformOverride
  }

  type OAuthConnectionMeta {
    accountId: String
    scopes: [String!]!
    expiresAt: String
  }

  type ApiKeyConnectionMeta {
    accountId: String
  }

  type AwsIamRoleConnectionMeta {
    accountId: String
    roleArn: String!
    region: String
    displayName: String
  }

  type AwsPresetRole {
    id: String!
    name: String!
    description: String!
    roleArn: String!
  }

  type AwsSetupInfo {
    trustPolicy: String!
  }

  union ConnectionMeta = OAuthConnectionMeta | ApiKeyConnectionMeta | AwsIamRoleConnectionMeta

  type IntegrationConnection {
    id: ID!
    providerId: String!
    provider: IntegrationProvider!
    connectionType: String!
    connectedAt: String!
    isRevoked: Boolean!
    meta: ConnectionMeta!
  }

  extend type Query {
    integrationProviders: [IntegrationProvider!]!
    integrationConnections(excludeCategory: String): [IntegrationConnection!]!
    defaultModel: DefaultModel
    defaultImageModel: DefaultModel
    defaultSpeechModel: DefaultModel
    enabledModels(providerId: String!): [String!]!
    allEnabledModels: [EnabledModelEntry!]!
    awsPresetRoles: [AwsPresetRole!]!
    awsSetupInfo: AwsSetupInfo!
    providerModels(providerId: String!): [ProviderModelInfo!]!
    enabledModelDetails(providerId: String!): [ModelInfo!]!
    speechVoices(connectionId: String!): [SpeechVoice!]!
  }

  extend type Mutation {
    connectApiKey(providerId: String!, apiKey: String!): ConnectApiKeyResult!
    revokeIntegrationConnection(id: ID!): IntegrationConnection!
    setDefaultModel(providerId: String!, modelId: String!): DefaultModel!
    setDefaultImageModel(providerId: String!, modelId: String!): DefaultModel!
    setDefaultSpeechModel(providerId: String!, modelId: String!): DefaultModel!
    enableModel(providerId: String!, modelId: String!, modelName: String): [EnabledModelEntry!]!
    disableModel(providerId: String!, modelId: String!): [EnabledModelEntry!]!
    connectAwsIamRole(roleArn: String!, displayName: String, region: String): IntegrationConnection!
    submitOAuthConnection(providerId: String!, accessToken: String!, refreshToken: String, expiresAt: String, scopes: [String!]!, accountId: String, clientId: String): IntegrationConnection!
  }
`;
