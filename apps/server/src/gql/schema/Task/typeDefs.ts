export const taskTypeDefs = /* GraphQL */ `
  enum TaskStatus {
    PENDING
    RUNNING
    WAITING
    COMPLETED
    FAILED
    ABANDONED
  }

  type Task {
    id: ID!
    agent: Agent!
    title: String!
    status: TaskStatus!
    statusReason: String
    createdAt: String!
    updatedAt: String!
    completedAt: String
    originJobId: String
    logs(first: Int, after: String, last: Int, before: String): AgentLogConnection!
  }

  extend type Query {
    tasks(agentId: ID!): [Task!]!
    task(id: ID!): Task
  }
`;
