import { graphql } from "../generated/gql";

export const DocumentQuery = graphql(`
  query Document($id: ID!) {
    document(id: $id) {
      id
      title
      body
      createdAt
      updatedAt
    }
  }
`);

export const DocumentUpdatedSubscription = graphql(`
  subscription DocumentUpdated($id: ID!) {
    documentUpdated(id: $id) {
      id
      title
      body
      updatedAt
    }
  }
`);
