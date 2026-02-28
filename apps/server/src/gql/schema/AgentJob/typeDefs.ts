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
    status: JobStatus!
    lastRun: String
    nextRun: String
  }

  extend type Query {
    agentJobs: [AgentJob!]!
    agentJob(id: ID!): AgentJob
  }

  extend type Mutation {
    updateJobStatus(id: ID!, status: JobStatus!): AgentJob
  }
`;
