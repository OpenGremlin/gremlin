export const integrationTypeDefs = /* GraphQL */ `
  type Permission {
    scope: String!
    label: String!
  }

  type Integration {
    id: ID!
    service: String!
    category: String!
    description: String!
    account: String
    connectedAt: String
    connected: Boolean!
    permissions: [Permission!]!
  }

  extend type Query {
    integrations: [Integration!]!
    integration(id: ID!): Integration
  }

  extend type Mutation {
    connectIntegration(provider: String!): String!
    disconnectIntegration(id: ID!): Boolean!
  }
`;
