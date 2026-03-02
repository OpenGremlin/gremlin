export const integrationTypeDefs = /* GraphQL */ `
  enum AuthMethod {
    OAUTH
    API_KEY
    TOKEN
  }

  type Permission {
    scope: String!
    label: String!
    enabled: Boolean!
  }

  type Integration {
    id: ID!
    service: String!
    icon: String!
    description: String!
    account: String!
    connectedAt: String!
    authMethod: AuthMethod!
    enabled: Boolean!
    permissions: [Permission!]!
  }

  extend type Query {
    integrations: [Integration!]!
    integration(id: ID!): Integration
  }

  extend type Mutation {
    togglePermission(integrationId: ID!, scope: String!, enabled: Boolean!): Integration
    setIntegrationEnabled(id: ID!, enabled: Boolean!): Integration
    disconnectIntegration(id: ID!): Boolean!
    connectGoogle: String!
  }
`;
