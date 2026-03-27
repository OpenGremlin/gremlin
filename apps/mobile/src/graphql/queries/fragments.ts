import { graphql } from "../generated/gql";

export const FileFields = graphql(`
  fragment FileFields on File {
    path
    name
    sizeBytes
    mimeType
    modifiedAt
    render {
      __typename
      ... on DocumentRender { markdown title }
      ... on CodeRender { content language }
      ... on ImageRender { url(width: 800) hiresUrl: url(width: 2400) width height aspectRatio }
      ... on AudioRender { url durationSeconds }
      ... on VideoRender { url thumbnailUrl(width: 400) durationSeconds }
      ... on UnknownRender { mimeType sizeBytes }
    }
  }
`);
