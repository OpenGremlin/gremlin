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
      enabled
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
      enabled
      permissions {
        scope
        label
        enabled
      }
    }
  }
`);

export const SetIntegrationEnabledMutation = graphql(`
  mutation SetIntegrationEnabled($id: ID!, $enabled: Boolean!) {
    setIntegrationEnabled(id: $id, enabled: $enabled) {
      id
      service
      icon
      description
      account
      connectedAt
      authMethod
      enabled
      permissions {
        scope
        label
        enabled
      }
    }
  }
`);

export const DisconnectIntegrationMutation = graphql(`
  mutation DisconnectIntegration($id: ID!) {
    disconnectIntegration(id: $id)
  }
`);
