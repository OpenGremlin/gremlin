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

  extend type Query {
    agentLogs(agentId: ID!): [AgentLog!]!
    taskLogs(taskId: ID!): [AgentLog!]!
  }
`;
