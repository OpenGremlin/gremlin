import { graphql } from "../generated/gql";

export const UserInputRequestsQuery = graphql(`
  query UserInputRequests {
    userInputRequests {
      ...UserInputRequestFields
    }
  }
`);

export const ResolveUserInputRequestMutation = graphql(`
  mutation ResolveUserInputRequest($id: ID!, $action: String!) {
    resolveUserInputRequest(id: $id, action: $action) {
      ...UserInputRequestFields
    }
  }
`);

export const DismissUserInputRequestMutation = graphql(`
  mutation DismissUserInputRequest($id: ID!) {
    dismissUserInputRequest(id: $id) {
      ...UserInputRequestFields
    }
  }
`);

export const PendingItemsUpdatedSubscription = graphql(`
  subscription PendingItemsUpdated {
    pendingItemsUpdated
  }
`);
