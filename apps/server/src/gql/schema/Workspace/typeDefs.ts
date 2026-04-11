export const workspaceTypeDefs = /* GraphQL */ `
  type WorkspaceEntry {
    name: String!
    path: String!
    isDirectory: Boolean!
    size: Int
    modifiedAt: String
    mimeType: String
  }

  enum SearchMode {
    FILENAME
    CONTENT
    ALL
  }

  type WorkspaceSearchResult {
    path: String!
    name: String!
    matchType: String!
    matchLine: Int
    matchContent: String
    matchContextBefore: [String!]
    matchContextAfter: [String!]
  }

  extend type Query {
    workspaceEntries(path: String!): [WorkspaceEntry!]!
    workspaceFile(path: String!): String
    workspaceSearch(query: String!, mode: SearchMode = ALL): [WorkspaceSearchResult!]!
  }
`;
