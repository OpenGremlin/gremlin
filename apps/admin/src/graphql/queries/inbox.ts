import { graphql } from "../generated/gql";

export const InboxItemsQuery = graphql(`
  query InboxItems($agentId: ID!) {
    inboxItems(agentId: $agentId) {
      id
      agentId
      type
      payload
      isRead
      createdAt
    }
  }
`);

export const InboxItemSubscription = graphql(`
  subscription InboxItemCreated($agentId: ID!) {
    inboxItemCreated(agentId: $agentId) {
      id
      agentId
      type
      payload
      isRead
      createdAt
    }
  }
`);
