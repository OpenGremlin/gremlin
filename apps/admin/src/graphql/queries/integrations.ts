import { graphql } from "../generated/gql";

export const IntegrationProvidersQuery = graphql(`
  query IntegrationProviders {
    integrationProviders {
      id
      service
      category
      description
      availableScopes {
        scope
        label
      }
      connectionCount
    }
  }
`);

export const IntegrationConnectionsQuery = graphql(`
  query IntegrationConnections {
    integrationConnections {
      id
      providerId
      connectionType
      description
      connectedAt
      isRevoked
      meta {
        ... on OAuthConnectionMeta {
          accountId
          scopes
          expiresAt
        }
        ... on ApiKeyConnectionMeta {
          accountId
        }
      }
    }
  }
`);

export const ConnectIntegrationMutation = graphql(`
  mutation ConnectIntegration($providerId: String!, $scopes: [String!]!) {
    connectIntegration(providerId: $providerId, scopes: $scopes)
  }
`);

export const RevokeConnectionMutation = graphql(`
  mutation RevokeConnection($id: ID!) {
    revokeIntegrationConnection(id: $id)
  }
`);
