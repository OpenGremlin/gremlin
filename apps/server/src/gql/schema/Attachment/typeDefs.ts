export const attachmentTypeDefs = /* GraphQL */ `
  union Attachment = FileAttachment | LinkAttachment

  type FileAttachment {
    file: File!
  }

  type LinkAttachment {
    url: String!
    title: String
    description: String
  }
`;
