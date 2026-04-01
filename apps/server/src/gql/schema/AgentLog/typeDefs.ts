import { ToolName } from "@opengremlin/lib/enums.js";

const toolNameEnum = `enum ToolName {\n${Object.values(ToolName)
  .map((v) => `    ${v}`)
  .join("\n")}\n  }`;

export const agentLogTypeDefs = /* GraphQL */ `
  enum AgentLogRole {
    AGENT
    USER
    SYSTEM
    TOOL
  }

  ${toolNameEnum}

  type AgentLog {
    id: ID!
    agent: Agent!
    taskId: String
    role: AgentLogRole!
    content: String!
    toolName: ToolName
    toolInput: String
    toolResult: String
    commandApprovalId: String
    attachments: [Attachment!]!
    documents: [Document!]! @deprecated(reason: "Use attachments instead")
    files: [File!]! @deprecated(reason: "Use attachments instead")
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
    pendingInboxMessages(agentId: ID!, taskId: String): [PendingInboxMessage!]!
  }

  type PendingInboxMessage {
    id: ID!
    content: String!
    createdAt: String!
  }

  type SendMessageResult {
    queued: Boolean!
    content: String!
  }

  extend type Mutation {
    sendMessage(agentId: ID!, content: String!, taskId: String): SendMessageResult!
  }

  type AgentStreamDelta {
    logId: ID!
    agentId: ID!
    taskId: String
    delta: String!
    done: Boolean!
  }

  extend type Subscription {
    agentLogCreated(agentId: ID!): AgentLog!
    "Subscribe to log entries by agentId or taskId"
    logCreated(agentId: ID, taskId: ID): AgentLog!
    agentStream(agentId: ID!): AgentStreamDelta!
  }
`;
