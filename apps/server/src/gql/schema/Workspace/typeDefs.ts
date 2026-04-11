export const workspaceTypeDefs = /* GraphQL */ `
  enum FileType {
    JAVASCRIPT
    TYPESCRIPT
    PYTHON
    GO
    RUST
    JAVA
    SWIFT
    SHELL
    WEB
    CONFIG
    CODE_OTHER
    DOCUMENT
    PDF
    IMAGE
    AUDIO
    VIDEO
    ARCHIVE
    UNKNOWN
  }

  type WorkspaceEntry {
    name: String!
    path: String!
    isDirectory: Boolean!
    size: Int
    modifiedAt: String
    mimeType: String
    fileType: FileType
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
    fileType: FileType
  }

  type WorkspaceMutationResult {
    """Paths that were successfully processed"""
    succeeded: [String!]!
    """Paths that failed"""
    failed: [String!]!
  }

  extend type Query {
    workspaceEntries(path: String!): [WorkspaceEntry!]!
    workspaceFile(path: String!): String
    workspaceSearch(query: String!, mode: SearchMode = ALL): [WorkspaceSearchResult!]!
  }

  extend type Mutation {
    """Delete one or more workspace files or directories"""
    deleteWorkspaceEntries(paths: [String!]!): WorkspaceMutationResult!
    """Move one or more workspace entries to a destination directory"""
    moveWorkspaceEntries(paths: [String!]!, destination: String!): WorkspaceMutationResult!
  }
`;
