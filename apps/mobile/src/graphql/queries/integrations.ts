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
    defaultModel {
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

export const SetDefaultModelMutation = graphql(`
  mutation SetDefaultModel($providerId: String!, $modelId: String!) {
    setDefaultModel(providerId: $providerId, modelId: $modelId)
  }
`);

export const BedrockEnabledModelsQuery = graphql(`
  query BedrockEnabledModels {
    bedrockEnabledModels
  }
`);

export const EnableBedrockModelMutation = graphql(`
  mutation EnableBedrockModel($modelId: String!) {
    enableBedrockModel(modelId: $modelId)
  }
`);

export const DisableBedrockModelMutation = graphql(`
  mutation DisableBedrockModel($modelId: String!) {
    disableBedrockModel(modelId: $modelId)
  }
`);

export const SubmitOAuthConnectionMutation = graphql(`
  mutation SubmitOAuthConnection(
    $providerId: String!
    $accessToken: String!
    $refreshToken: String
    $expiresAt: String
    $scopes: [String!]!
    $accountId: String
  ) {
    submitOAuthConnection(
      providerId: $providerId
      accessToken: $accessToken
      refreshToken: $refreshToken
      expiresAt: $expiresAt
      scopes: $scopes
      accountId: $accountId
    )
  }
`);
