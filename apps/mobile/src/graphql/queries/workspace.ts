import { graphql } from "../generated/gql";

export const WorkspaceEntriesQuery = graphql(`
  query WorkspaceEntries($path: String!) {
    workspaceEntries(path: $path) {
      name
      path
      isDirectory
      size
      modifiedAt
    }
  }
`);

export const WorkspaceFileQuery = graphql(`
  query WorkspaceFile($path: String!) {
    workspaceFile(path: $path)
  }
`);

export const FileQuery = graphql(`
  query File($path: String!) {
    file(path: $path) {
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
  }
`);
