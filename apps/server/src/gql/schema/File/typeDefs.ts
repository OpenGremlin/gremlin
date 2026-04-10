export const fileTypeDefs = /* GraphQL */ `
  type File {
    path: String!
    name: String!
    sizeBytes: Int!
    mimeType: String
    modifiedAt: String!
    render: FileRender!
  }

  union FileRender =
      ImageRender
    | DocumentRender
    | CodeRender
    | AudioRender
    | VideoRender
    | PdfRender
    | UnknownRender

  type ImageRender {
    url(width: Int): String!
    aspectRatio: Float
    width: Int
    height: Int
  }

  type DocumentRender {
    markdown: String!
    title: String
  }

  type CodeRender {
    content: String!
    language: String!
  }

  type AudioRender {
    url: String!
    durationSeconds: Float
  }

  type VideoRender {
    url: String!
    thumbnailUrl(width: Int): String
    durationSeconds: Float
  }

  type PdfRender {
    url: String!
  }

  type UnknownRender {
    mimeType: String
    sizeBytes: Int!
  }

  extend type Query {
    file(path: String!): File
  }
`;
