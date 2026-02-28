export const agentTypeDefs = /* GraphQL */ `
  enum AgentStatus {
    ACTIVE
    IDLE
    ERROR
  }

  type Agent {
    id: ID!
    name: String!
    avatar: String!
    soul: String!
    status: AgentStatus!
  }

  extend type Query {
    agents: [Agent!]!
    agent(id: ID!): Agent
  }

  extend type Mutation {
    updateAgentStatus(id: ID!, status: AgentStatus!): Agent
  }
`;
