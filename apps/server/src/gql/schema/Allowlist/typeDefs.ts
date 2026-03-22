export const allowlistTypeDefs = /* GraphQL */ `
  type AllowlistEntry {
    pattern: String!
  }

  extend type Query {
    commandAllowlist(agentId: ID!): [AllowlistEntry!]!
  }

  extend type Mutation {
    addCommandAllowlistEntry(agentId: ID!, pattern: String!): [AllowlistEntry!]!
    removeCommandAllowlistEntry(agentId: ID!, pattern: String!): [AllowlistEntry!]!
  }
`;
