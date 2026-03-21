export const userInputRequestTypeDefs = /* GraphQL */ `
  enum UserInputRequestStatus {
    PENDING
    RESOLVED
    DISMISSED
  }

  type UserInputRequestAction {
    label: String!
    style: String!
  }

  type UserInputRequest {
    id: ID!
    agent: Agent!
    turnId: String
    message: String!
    actions: [UserInputRequestAction!]!
    status: UserInputRequestStatus!
    resolvedAction: String
    createdAt: String!
  }

  extend type Query {
    userInputRequests: [UserInputRequest!]!
  }

  extend type Mutation {
    resolveUserInputRequest(id: ID!, action: String!): UserInputRequest
    dismissUserInputRequest(id: ID!): UserInputRequest
  }
`;
