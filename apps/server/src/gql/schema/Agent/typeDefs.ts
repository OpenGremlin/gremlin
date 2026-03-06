export const agentTypeDefs = /* GraphQL */ `
  type Agent {
    id: ID!
    name: String!
    avatar: String!
    portraitId: String!
    imageUrl(width: Int): String!
    soul: String!
    retired: Boolean!
    ttsVoice: String
  }

  extend type Query {
    agents: [Agent!]!
    agent(id: ID!): Agent
  }

  input UpdateAgentInput {
    name: String
    soul: String
    avatar: String
    ttsVoice: String
  }

  input CreateAgentInput {
    id: String!
    name: String!
    soul: String
  }

  extend type Mutation {
    createAgent(input: CreateAgentInput!): Agent!
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent
    retireAgent(id: ID!): Agent!
  }

  extend type Subscription {
    agentUpdated(agentId: ID!): Agent!
    agentsUpdated(agentIds: [ID!]!): Agent!
  }
`;
