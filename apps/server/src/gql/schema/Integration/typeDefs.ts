export const integrationTypeDefs = /* GraphQL */ `
  type AvailableScope {
    scope: String!
    label: String!
  }

  type IntegrationProvider {
    id: ID!
    service: String!
    category: String!
    description: String!
    availableScopes: [AvailableScope!]!
    connectionCount: Int!
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
  }

  extend type Mutation {
    connectIntegration(providerId: String!, scopes: [String!]!): String!
    renameIntegrationConnection(id: ID!, description: String!): Boolean!
    revokeIntegrationConnection(id: ID!): Boolean!
  }
`;
