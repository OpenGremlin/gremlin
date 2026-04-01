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

  union ConnectionMeta = OAuthConnectionMeta | ApiKeyConnectionMeta

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
    enabledModels(providerId: String!): [String!]!
    allEnabledModels: [EnabledModelEntry!]!
    bedrockEnabledModels: [String!]!
    bedrockAvailableModels: [ModelInfo!]!
    providerModels(providerId: String!): [ProviderModelInfo!]!
    enabledModelDetails(providerId: String!): [ModelInfo!]!
  }

  extend type Mutation {
    connectApiKey(providerId: String!, apiKey: String!): ConnectApiKeyResult!
    revokeIntegrationConnection(id: ID!): IntegrationConnection!
    setDefaultModel(providerId: String!, modelId: String!): DefaultModel!
    setDefaultImageModel(providerId: String!, modelId: String!): DefaultModel!
    enableModel(providerId: String!, modelId: String!, modelName: String): [EnabledModelEntry!]!
    disableModel(providerId: String!, modelId: String!): [EnabledModelEntry!]!
    enableBedrockModel(modelId: String!, modelName: String): [String!]!
    disableBedrockModel(modelId: String!): [String!]!
    submitOAuthConnection(providerId: String!, accessToken: String!, refreshToken: String, expiresAt: String, scopes: [String!]!, accountId: String, clientId: String): IntegrationConnection!
  }
`;
