import { graphql } from "../generated/gql";

export const IntegrationProvidersQuery = graphql(`
  query IntegrationProviders {
    integrationProviders {
      id
      service
      category
      description
      connectionType
      availableScopes {
        scope
        label
      }
      models {
        id
        name
        contextWindow
        maxTokens
        reasoning
        inputCost
        outputCost
      }
      connectionCount
      hasConnection
    }
    activeModel {
      providerId
      modelId
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
        __typename
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

export const ConnectApiKeyMutation = graphql(`
  mutation ConnectApiKey($providerId: String!, $apiKey: String!) {
    connectApiKey(providerId: $providerId, apiKey: $apiKey)
  }
`);

export const RenameConnectionMutation = graphql(`
  mutation RenameConnection($id: ID!, $description: String!) {
    renameIntegrationConnection(id: $id, description: $description)
  }
`);

export const RevokeConnectionMutation = graphql(`
  mutation RevokeConnection($id: ID!) {
    revokeIntegrationConnection(id: $id)
  }
`);

export const SetActiveModelMutation = graphql(`
  mutation SetActiveModel($providerId: String!, $modelId: String!) {
    setActiveModel(providerId: $providerId, modelId: $modelId)
  }
`);
