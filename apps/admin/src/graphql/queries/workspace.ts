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
