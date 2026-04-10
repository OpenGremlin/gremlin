export const fileUploadTypeDefs = /* GraphQL */ `
  input FileUploadRequest {
    filename: String!
    contentType: String!
    sizeBytes: Int!
  }

  type FileUploadUrl {
    uploadId: String!
    presignedUrl: String!
    key: String!
  }

  input CompleteFileUploadInput {
    agentId: String!
    taskId: String
    key: String!
    filename: String!
    contentType: String!
    sizeBytes: Int!
  }

  type CompletedFileUpload {
    path: String!
    filename: String!
    sizeBytes: Int!
    contentType: String!
  }

  "Attach a reference to an existing workspace file in an agent's log (no upload needed)."
  input AttachFileReferenceInput {
    agentId: String!
    taskId: String
    "Workspace-relative path, e.g. uploads/2026-04-10/notes.md"
    filePath: String!
  }

  type Mutation {
    requestFileUploads(agentId: String!, taskId: String, files: [FileUploadRequest!]!): [FileUploadUrl!]!
    completeFileUpload(input: CompleteFileUploadInput!): CompletedFileUpload!
    attachFileReference(input: AttachFileReferenceInput!): Boolean!
  }
`;
