import { graphql } from "../generated/gql";

export const NotificationsQuery = graphql(`
  query Notifications {
    notifications {
      id
      agent {
        id
        name
      }
      type
      turnId
      message
      actions {
        id
        label
        style
      }
      status
      resolvedAction
      createdAt
    }
  }
`);

export const ResolveNotificationMutation = graphql(`
  mutation ResolveNotification($id: ID!, $actionId: String!) {
    resolveNotification(id: $id, actionId: $actionId) {
      id
      status
      resolvedAction
    }
  }
`);

export const DismissNotificationMutation = graphql(`
  mutation DismissNotification($id: ID!) {
    dismissNotification(id: $id) {
      id
      status
    }
  }
`);
