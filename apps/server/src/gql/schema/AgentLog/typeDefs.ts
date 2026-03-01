export const agentLogTypeDefs = /* GraphQL */ `
  enum AgentLogRole {
    AGENT
    USER
    SYSTEM
    TOOL
  }

  type AgentLog {
    id: ID!
    agent: Agent!
    taskId: String
    role: AgentLogRole!
    content: String!
    createdAt: String!
  }

  type AgentLogEdge {
    cursor: String!
    node: AgentLog!
  }

  type AgentLogPageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type AgentLogConnection {
    edges: [AgentLogEdge!]!
    pageInfo: AgentLogPageInfo!
  }

  extend type Query {
    agentLogs(agentId: ID!, first: Int, after: String, last: Int, before: String): AgentLogConnection!
    taskLogs(taskId: ID!, first: Int, after: String, last: Int, before: String): AgentLogConnection!
  }
`;
