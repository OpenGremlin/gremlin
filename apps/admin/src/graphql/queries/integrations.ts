import { graphql } from "../generated/gql";

export const IntegrationsQuery = graphql(`
  query Integrations {
    integrations {
      id
      service
      icon
      account
    }
  }
`);

export const IntegrationQuery = graphql(`
  query Integration($id: ID!) {
    integration(id: $id) {
      id
      service
      icon
      description
      account
      connectedAt
      authMethod
      permissions {
        scope
        label
        enabled
      }
    }
  }
`);

export const ConnectGoogleMutation = graphql(`
  mutation ConnectGoogle {
    connectGoogle
  }
`);

export const TogglePermissionMutation = graphql(`
  mutation TogglePermission($integrationId: ID!, $scope: String!, $enabled: Boolean!) {
    togglePermission(integrationId: $integrationId, scope: $scope, enabled: $enabled) {
      id
      service
      icon
      description
      account
      connectedAt
      authMethod
      permissions {
        scope
        label
        enabled
      }
    }
  }
`);
