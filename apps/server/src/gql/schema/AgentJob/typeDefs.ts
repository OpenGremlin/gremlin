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
    agent: Agent!
    status: JobStatus!
    lastRun: String
    nextRun: String
    statuses: [Status!]!
  }

  input UpdateAgentJobInput {
    name: String
    description: String
    recurrence: String
    agentId: String
  }

  extend type Query {
    agentJobs: [AgentJob!]!
    agentJob(id: ID!): AgentJob
  }

  extend type Mutation {
    updateJobStatus(id: ID!, status: JobStatus!): AgentJob
    updateAgentJob(id: ID!, input: UpdateAgentJobInput!): AgentJob
  }
`;
