import { graphql } from "../generated/gql";

export const IntegrationsQuery = graphql(`
  query Integrations {
    integrations {
      id
      service
      category
      description
      connected
      account
    }
  }
`);

export const IntegrationQuery = graphql(`
  query Integration($id: ID!) {
    integration(id: $id) {
      id
      service
      category
      description
      account
      connectedAt
      connected
      permissions {
        scope
        label
      }
    }
  }
`);

export const ConnectIntegrationMutation = graphql(`
  mutation ConnectIntegration($provider: String!) {
    connectIntegration(provider: $provider)
  }
`);

export const DisconnectIntegrationMutation = graphql(`
  mutation DisconnectIntegration($id: ID!) {
    disconnectIntegration(id: $id)
  }
`);
