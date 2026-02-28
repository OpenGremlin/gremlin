export const feedTypeDefs = /* GraphQL */ `
  enum FeedCategory {
    RESEARCH
    TASK
    MONITOR
    REPORT
  }

  type FeedItem {
    id: ID!
    agentName: String!
    avatarState: String!
    portraitId: String!
    imageUrl(width: Int): String!
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
