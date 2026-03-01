export const feedTypeDefs = /* GraphQL */ `
  enum FeedCategory {
    RESEARCH
    TASK
    MONITOR
    REPORT
  }

  type FeedItem {
    id: ID!
    agent: Agent!
    title: String!
    summary: String!
    body: String!
    category: FeedCategory!
    completedAt: String!
  }

  extend type Query {
    feedItems: [FeedItem!]!
    feedItem(id: ID!): FeedItem
  }
`;
