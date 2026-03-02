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

  input UpdateAgentInput {
    name: String
    soul: String
    avatar: String
  }

  extend type Mutation {
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent
    updateAgentStatus(id: ID!, status: AgentStatus!): Agent
  }

  extend type Subscription {
    agentUpdated(agentId: ID!): Agent!
    agentsUpdated(agentIds: [ID!]!): Agent!
  }
`;
