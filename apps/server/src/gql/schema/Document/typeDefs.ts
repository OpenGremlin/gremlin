export const documentTypeDefs = /* GraphQL */ `
  type Document {
    id: ID!
    title: String!
    body: String!
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    document(id: ID!): Document
  }
`;
