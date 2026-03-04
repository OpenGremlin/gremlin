export const inboxItemTypeDefs = /* GraphQL */ `
  type InboxItem {
    id: ID!
    agentId: ID!
    type: String!
    payload: String!
    isRead: Boolean!
    createdAt: String!
  }

  extend type Query {
    inboxItems(agentId: ID!): [InboxItem!]!
  }

  extend type Subscription {
    inboxItemCreated(agentId: ID!): InboxItem!
  }
`;
