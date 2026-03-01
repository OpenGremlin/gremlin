export const agentTypeDefs = /* GraphQL */ `
  enum AgentStatus {
    ACTIVE
    SCHEDULED
    IDLE
    BLOCKED
  }

  type Agent {
    id: ID!
    name: String!
    avatar: String!
    portraitId: String!
    imageUrl(width: Int): String!
    soul: String!
    status: AgentStatus!
    statusReason: String
  }

  extend type Query {
    agents: [Agent!]!
    agent(id: ID!): Agent
  }

  extend type Mutation {
    updateAgentStatus(id: ID!, status: AgentStatus!): Agent
  }
`;
