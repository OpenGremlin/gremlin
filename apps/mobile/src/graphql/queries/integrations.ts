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
      provider {
        id
        service
        description
      }
      connectionType
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
    connectApiKey(providerId: $providerId, apiKey: $apiKey) {
      connectionId
      models {
        id
        name
      }
    }
  }
`);

export const ProviderModelsQuery = graphql(`
  query ProviderModels($providerId: String!) {
    providerModels(providerId: $providerId) {
      id
      name
    }
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
    $clientId: String
    $clientSecret: String
    $tokenUrl: String
    $tokenAuthMethod: String
  ) {
    submitOAuthConnection(
      providerId: $providerId
      accessToken: $accessToken
      refreshToken: $refreshToken
      expiresAt: $expiresAt
      scopes: $scopes
      accountId: $accountId
      clientId: $clientId
      clientSecret: $clientSecret
      tokenUrl: $tokenUrl
      tokenAuthMethod: $tokenAuthMethod
    )
  }
`);
