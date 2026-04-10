export const taskTypeDefs = /* GraphQL */ `
  type Task {
    id: ID!
    agent: Agent!
    title: String!
    message: String
    createdAt: String!
    updatedAt: String!
    completedAt: String
    originJobId: String
    emoji: String
    attachments: [Attachment!]!
    logs(first: Int, after: String, last: Int, before: String): AgentLogConnection!
  }

  type TaskEdge {
    cursor: String!
    node: Task!
  }

  type TaskPageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: TaskPageInfo!
  }

  extend type Query {
    tasks(first: Int, after: String, last: Int, before: String): TaskConnection!
    task(id: ID!): Task
  }

  type SandboxOutput {
    commandId: String!
    stream: String!
    data: String!
    done: Boolean
    exitCode: Int
  }

  extend type Subscription {
    taskUpdated(taskId: ID!): Task!
    tasksUpdated(taskIds: [ID!]!): Task!
    jobTaskCreated(jobId: ID!): Task!
    taskLogCreated(taskId: ID!): AgentLog!
    sandboxOutput(taskId: ID!): SandboxOutput!
  }
`;
