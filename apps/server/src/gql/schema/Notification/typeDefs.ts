export const notificationTypeDefs = /* GraphQL */ `
  enum NotificationType {
    PERMISSION
    APPROVAL
  }

  enum NotificationStatus {
    PENDING
    RESOLVED
    DISMISSED
  }

  type NotificationAction {
    id: String!
    label: String!
    style: String!
  }

  type Notification {
    id: ID!
    agent: Agent!
    type: NotificationType!
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
    resolveNotification(id: ID!, actionId: String!): Notification
    dismissNotification(id: ID!): Notification
  }
`;
