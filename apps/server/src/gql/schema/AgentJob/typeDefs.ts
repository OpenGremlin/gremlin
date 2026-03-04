export const agentJobTypeDefs = /* GraphQL */ `
  enum JobStatus {
    RUNNING
    IDLE
    ERROR
    PAUSED
  }

  type AgentJob {
    id: ID!
    name: String!
    description: String!
    recurrence: String!
    cronExpression: String
    timezone: String!
    agent: Agent!
    status: JobStatus!
    lastRun: String
    nextRun: String
    tasks: [Task!]!
  }

  input UpdateAgentJobInput {
    name: String
    description: String
    recurrence: String
    agentId: String
    timezone: String
  }

  input CreateAgentJobInput {
    name: String!
    description: String!
    recurrence: String!
    timezone: String!
    agentId: String
  }

  extend type Query {
    agentJobs: [AgentJob!]!
    agentJob(id: ID!): AgentJob
  }

  extend type Mutation {
    updateJobStatus(id: ID!, status: JobStatus!): AgentJob
    updateAgentJob(id: ID!, input: UpdateAgentJobInput!): AgentJob
    createAgentJob(input: CreateAgentJobInput!): AgentJob!
    deleteAgentJob(id: ID!): AgentJob
  }
`;
