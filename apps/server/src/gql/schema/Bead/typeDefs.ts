export const beadTypeDefs = /* GraphQL */ `
  enum BeadStatus {
    OPEN
    IN_PROGRESS
    BLOCKED
    CLOSED
  }

  type Bead {
    id: ID!
    title: String!
    status: BeadStatus!
    assignee: String
    assigneeName: String
    parentId: ID
    latestComment: String
    children: [Bead!]
  }

  extend type Query {
    bead(id: ID!): Bead
  }

  extend type Subscription {
    beadUpdated(id: ID!): Bead
  }
`;
