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
    connectionType: String!
    description: String!
    connectedAt: String!
    isRevoked: Boolean!
    meta: ConnectionMeta!
  }

  extend type Query {
    integrationProviders: [IntegrationProvider!]!
    integrationConnections: [IntegrationConnection!]!
    defaultModel: DefaultModel
    bedrockEnabledModels: [String!]!
  }

  extend type Mutation {
    connectIntegration(providerId: String!, scopes: [String!]!): String!
    connectApiKey(providerId: String!, apiKey: String!): ID!
    renameIntegrationConnection(id: ID!, description: String!): Boolean!
    revokeIntegrationConnection(id: ID!): Boolean!
    setDefaultModel(providerId: String!, modelId: String!): Boolean!
    enableBedrockModel(modelId: String!): Boolean!
    disableBedrockModel(modelId: String!): Boolean!
    submitOAuthConnection(providerId: String!, accessToken: String!, refreshToken: String, expiresAt: String, scopes: [String!]!, accountId: String): ID!
  }
`;
