export const commandApprovalTypeDefs = /* GraphQL */ `
  enum CommandApprovalStatus {
    PENDING
    RESOLVED
  }

  enum CommandApprovalDecision {
    ALLOW_ONCE
    ALLOW_ALWAYS
    DENY
  }

  type CommandApproval {
    id: ID!
    agent: Agent!
    taskId: String!
    command: String!
    reason: String!
    status: CommandApprovalStatus!
    decision: String
    createdAt: String!
    resolvedAt: String
  }

  extend type Mutation {
    resolveCommandApproval(id: ID!, decision: CommandApprovalDecision!): CommandApproval
  }
`;
