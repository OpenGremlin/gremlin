import { graphql } from "../generated/gql";

export const PostQuery = graphql(`
  query Post($id: ID!) {
    post(id: $id) {
      ...PostSummary
    }
  }
`);

export const PostsQuery = graphql(`
  query Posts($first: Int, $after: String, $last: Int, $before: String) {
    posts(first: $first, after: $after, last: $last, before: $before) {
      edges {
        cursor
        node {
          ...PostSummary
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`);

export const PostCreatedSubscription = graphql(`
  subscription PostCreated {
    postCreated {
      ...PostSummary
    }
  }
`);

export const DeletePostMutation = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`);
