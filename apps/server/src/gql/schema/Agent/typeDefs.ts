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
    commandApproval: String!
  }

  type AgentWebSearchConfig {
    enabled: Boolean!
    provider: String
  }

  type AgentReasoningConfig {
    enabled: Boolean!
  }

  type AgentViewImageConfig {
    enabled: Boolean!
  }

  type AgentImageGenerationConfig {
    enabled: Boolean!
  }

  type AgentProgramsConfig {
    enabled: Boolean!
  }

  type AgentSpeechConfig {
    enabled: Boolean!
    voice: String
  }

  type AgentConfig {
    model: AgentModelConfig
    imageModel: AgentModelConfig
    speechModel: AgentModelConfig
    sandbox: AgentSandboxConfig
    webSearch: AgentWebSearchConfig
    reasoning: AgentReasoningConfig
    viewImage: AgentViewImageConfig
    imageGeneration: AgentImageGenerationConfig
    speech: AgentSpeechConfig
    programs: AgentProgramsConfig
  }

  type Agent {
    id: ID!
    name: String!
    avatar: String!
    portraitId: String!
    imageUrl(width: Int): String!
    personality: String
    role: String
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
    commandApproval: String!
  }

  input AgentWebSearchConfigInput {
    enabled: Boolean!
    provider: String
  }

  input AgentReasoningConfigInput {
    enabled: Boolean!
  }

  input AgentViewImageConfigInput {
    enabled: Boolean!
  }

  input AgentImageGenerationConfigInput {
    enabled: Boolean!
  }

  input AgentProgramsConfigInput {
    enabled: Boolean!
  }

  input AgentSpeechConfigInput {
    enabled: Boolean!
    voice: String
  }

  input AgentConfigInput {
    model: AgentModelConfigInput
    imageModel: AgentModelConfigInput
    speechModel: AgentModelConfigInput
    sandbox: AgentSandboxConfigInput
    webSearch: AgentWebSearchConfigInput
    reasoning: AgentReasoningConfigInput
    viewImage: AgentViewImageConfigInput
    imageGeneration: AgentImageGenerationConfigInput
    speech: AgentSpeechConfigInput
    programs: AgentProgramsConfigInput
  }

  input UpdateAgentInput {
    name: String
    personality: String
    role: String
    avatar: String
    ttsVoice: String
    config: AgentConfigInput
  }

  input CreateAgentInput {
    id: String!
    name: String!
    personality: String
    role: String
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
