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

  type Mutation {
    requestFileUploads(agentId: String!, taskId: String, files: [FileUploadRequest!]!): [FileUploadUrl!]!
    completeFileUpload(input: CompleteFileUploadInput!): CompletedFileUpload!
  }
`;
