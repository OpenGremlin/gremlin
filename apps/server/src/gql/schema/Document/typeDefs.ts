export const documentTypeDefs = /* GraphQL */ `
  type Document {
    id: ID!
    title: String!
    body: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateDocumentInput {
    title: String!
    body: String!
  }

  input UpdateDocumentInput {
    title: String!
    body: String!
  }

  extend type Query {
    documents: [Document!]!
    document(id: ID!): Document
  }

  extend type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
  }

  extend type Subscription {
    documentUpdated(id: ID!): Document!
  }
`;
