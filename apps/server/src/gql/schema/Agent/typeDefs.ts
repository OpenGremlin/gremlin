export const agentTypeDefs = /* GraphQL */ `
  type AgentModelConfig {
    type: String!
    modelId: String
    connectionId: String
  }

  type AgentSandboxConfig {
    enabled: Boolean!
    idleTimeoutMinutes: Int
    alwaysOn: Boolean
  }

  type AgentWebSearchConfig {
    enabled: Boolean!
    provider: String
  }

  type AgentViewImageConfig {
    enabled: Boolean!
  }

  type AgentConfig {
    model: AgentModelConfig
    sandbox: AgentSandboxConfig
    webSearch: AgentWebSearchConfig
    viewImage: AgentViewImageConfig
  }

  type Agent {
    id: ID!
    name: String!
    avatar: String!
    portraitId: String!
    imageUrl(width: Int): String!
    soul: String!
    retired: Boolean!
    ttsVoice: String
    config: AgentConfig
  }

  extend type Query {
    agents: [Agent!]!
    agent(id: ID!): Agent
  }

  input AgentModelConfigInput {
    type: String!
    modelId: String
    connectionId: String
  }

  input AgentSandboxConfigInput {
    enabled: Boolean!
    idleTimeoutMinutes: Int
    alwaysOn: Boolean
  }

  input AgentWebSearchConfigInput {
    enabled: Boolean!
    provider: String
  }

  input AgentViewImageConfigInput {
    enabled: Boolean!
  }

  input AgentConfigInput {
    model: AgentModelConfigInput
    sandbox: AgentSandboxConfigInput
    webSearch: AgentWebSearchConfigInput
    viewImage: AgentViewImageConfigInput
  }

  input UpdateAgentInput {
    name: String
    soul: String
    avatar: String
    ttsVoice: String
    config: AgentConfigInput
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
    unretireAgent(id: ID!): Agent!
  }

  extend type Subscription {
    agentUpdated(agentId: ID!): Agent!
    agentsUpdated(agentIds: [ID!]!): Agent!
  }
`;
