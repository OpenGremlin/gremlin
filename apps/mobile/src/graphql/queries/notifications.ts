import { graphql } from "../generated/gql";

export const NotificationsQuery = graphql(`
  query Notifications {
    notifications {
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

export const ResolveNotificationMutation = graphql(`
  mutation ResolveNotification($id: ID!, $action: String!) {
    resolveNotification(id: $id, action: $action) {
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
