import { graphql } from "../generated/gql";

export const UserInputRequestsQuery = graphql(`
  query UserInputRequests {
    userInputRequests {
      id
      agent {
        id
        name
      }
      turnId
      message
      actions {
        label
        style
      }
      status
      resolvedAction
      createdAt
    }
  }
`);

export const ResolveUserInputRequestMutation = graphql(`
  mutation ResolveUserInputRequest($id: ID!, $action: String!) {
    resolveUserInputRequest(id: $id, action: $action) {
      id
      status
      resolvedAction
    }
  }
`);

export const DismissUserInputRequestMutation = graphql(`
  mutation DismissUserInputRequest($id: ID!) {
    dismissUserInputRequest(id: $id) {
      id
      status
    }
  }
`);

export const PendingItemsUpdatedSubscription = graphql(`
  subscription PendingItemsUpdated {
    pendingItemsUpdated
  }
`);
