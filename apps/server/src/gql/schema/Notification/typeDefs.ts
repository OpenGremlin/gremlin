export const notificationTypeDefs = /* GraphQL */ `
  enum NotificationStatus {
    PENDING
    RESOLVED
    DISMISSED
  }

  type NotificationAction {
    label: String!
    style: String!
  }

  type Notification {
    id: ID!
    agent: Agent!
    turnId: String
    message: String!
    actions: [NotificationAction!]!
    status: NotificationStatus!
    resolvedAction: String
    createdAt: String!
  }

  extend type Query {
    notifications: [Notification!]!
  }

  extend type Mutation {
    resolveNotification(id: ID!, action: String!): Notification
    dismissNotification(id: ID!): Notification
  }
`;
