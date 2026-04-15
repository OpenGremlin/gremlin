export const postTypeDefs = /* GraphQL */ `
  type Post {
    id: ID!
    agent: Agent
    taskId: ID!
    title: String!
    message: String!
    attachments: [Attachment!]!
    createdAt: String!
  }

  type PostEdge {
    cursor: String!
    node: Post!
  }

  type PostPageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PostPageInfo!
  }

  extend type Query {
    post(id: ID!): Post
    posts(first: Int, after: String, last: Int, before: String): PostConnection!
  }

  extend type Subscription {
    postCreated: Post!
  }
`;
