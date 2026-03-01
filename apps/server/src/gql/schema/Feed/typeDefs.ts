export const feedTypeDefs = /* GraphQL */ `
  enum StatusCategory {
    RESEARCH
    TASK
    MONITOR
    REPORT
  }

  type Document {
    title: String!
    body: String!
  }

  union Artifact = Document

  type Status {
    id: ID!
    agent: Agent!
    title: String!
    summary: String!
    artifacts: [Artifact!]!
    category: StatusCategory!
    completedAt: String!
  }

  extend type Query {
    statuses: [Status!]!
    status(id: ID!): Status
  }
`;
