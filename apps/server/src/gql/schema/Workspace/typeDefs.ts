export const workspaceTypeDefs = /* GraphQL */ `
  type WorkspaceEntry {
    name: String!
    path: String!
    isDirectory: Boolean!
    size: Int
    modifiedAt: String
  }

  extend type Query {
    workspaceEntries(path: String!): [WorkspaceEntry!]!
    workspaceFile(path: String!): String
  }
`;
