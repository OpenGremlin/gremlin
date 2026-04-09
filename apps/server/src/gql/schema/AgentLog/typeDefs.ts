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
    displayHint: String
    displayVariant: String
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
    "Build TTS audio URLs for a completed agent log message, one per sentence"
    speechUrls(logId: ID!): [String!]!
    "Build TTS audio URLs for arbitrary text using an agent's voice config"
    documentSpeechUrls(text: String!, agentId: ID!): [String!]!
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
    "text (default) or reasoning"
    kind: String
  }

  type SpeechAudioChunk {
    logId: ID!
    agentId: ID!
    sentenceIndex: Int!
    url: String!
    done: Boolean!
  }

  extend type Subscription {
    agentLogCreated(agentId: ID!): AgentLog!
    "Subscribe to log entries by agentId or taskId"
    logCreated(agentId: ID, taskId: ID): AgentLog!
    agentStream(agentId: ID!): AgentStreamDelta!
    "Subscribe to sentence-level TTS audio URLs by agentId or taskId"
    speechStream(agentId: ID, taskId: ID): SpeechAudioChunk!
  }
`;
