import { graphql } from "../generated/gql";

export const WorkspaceEntriesQuery = graphql(`
  query WorkspaceEntries($path: String!) {
    workspaceEntries(path: $path) {
      name
      path
      isDirectory
      size
      modifiedAt
      fileType
    }
  }
`);

export const WorkspaceFileQuery = graphql(`
  query WorkspaceFile($path: String!) {
    workspaceFile(path: $path)
  }
`);

export const WorkspaceSearchQuery = graphql(`
  query WorkspaceSearch($query: String!, $mode: SearchMode = ALL) {
    workspaceSearch(query: $query, mode: $mode) {
      path
      name
      matchType
      matchLine
      matchContent
      matchContextBefore
      matchContextAfter
      fileType
    }
  }
`);

export const DeleteWorkspaceEntriesMutation = graphql(`
  mutation DeleteWorkspaceEntries($paths: [String!]!) {
    deleteWorkspaceEntries(paths: $paths) {
      succeeded
      failed
    }
  }
`);

export const MoveWorkspaceEntriesMutation = graphql(`
  mutation MoveWorkspaceEntries($paths: [String!]!, $destination: String!) {
    moveWorkspaceEntries(paths: $paths, destination: $destination) {
      succeeded
      failed
    }
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
      fileType
      render {
        __typename
        ... on DocumentRender { markdown title }
        ... on CodeRender { content language }
        ... on ImageRender { url(width: 800) fullUrl: url width height aspectRatio }
        ... on AudioRender { url durationSeconds }
        ... on VideoRender { url thumbnailUrl(width: 400) durationSeconds }
        ... on UnknownRender { mimeType sizeBytes }
      }
    }
  }
`);
