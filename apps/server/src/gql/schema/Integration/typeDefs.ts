export const integrationTypeDefs = /* GraphQL */ `
  type AvailableScope {
    scope: String!
    label: String!
  }

  type ModelInfo {
    id: ID!
    name: String!
    contextWindow: Int!
    maxTokens: Int!
    reasoning: Boolean!
    inputCost: Float
    outputCost: Float
  }

  type DefaultModel {
    providerId: String!
    modelId: String!
  }

  type ProviderModelInfo {
    id: ID!
    name: String!
  }

  type EnabledModelEntry {
    providerId: String!
    modelId: String!
    modelName: String
  }

  type ConnectApiKeyResult {
    connectionId: ID!
    models: [ProviderModelInfo!]!
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
    integrationConnections: [IntegrationConnection!]!
    defaultModel: DefaultModel
    enabledModels(providerId: String!): [String!]!
    allEnabledModels: [EnabledModelEntry!]!
    bedrockEnabledModels: [String!]!
    bedrockAvailableModels: [ModelInfo!]!
    providerModels(providerId: String!): [ProviderModelInfo!]!
  }

  extend type Mutation {
    connectApiKey(providerId: String!, apiKey: String!): ConnectApiKeyResult!
    revokeIntegrationConnection(id: ID!): Boolean!
    setDefaultModel(providerId: String!, modelId: String!): Boolean!
    enableModel(providerId: String!, modelId: String!): Boolean!
    disableModel(providerId: String!, modelId: String!): Boolean!
    enableBedrockModel(modelId: String!): Boolean!
    disableBedrockModel(modelId: String!): Boolean!
    submitOAuthConnection(providerId: String!, accessToken: String!, refreshToken: String, expiresAt: String, scopes: [String!]!, accountId: String, clientId: String, clientSecret: String, tokenUrl: String, tokenAuthMethod: String): ID!
  }
`;
