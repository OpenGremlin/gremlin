import { graphql } from "../generated/gql";

export const IntegrationProvidersQuery = graphql(`
  query IntegrationProviders {
    integrationProviders {
      id
      service
      category
      description
      connectionType
      authorizeUrl
      tokenUrl
      defaultClientId
      defaultScopes
      scopePrefix
      extraAuthParams
      userInfo
      ios {
        clientId
        redirectUri
      }
      android {
        clientId
        redirectUri
      }
      availableScopes {
        scope
        label
      }
      models {
        id
        name
        mode
      }
      connectionCount
      hasConnection
    }
    defaultModel {
      providerId
      modelId
      modelName
    }
    defaultImageModel {
      providerId
      modelId
      modelName
    }
  }
`);

export const IntegrationConnectionsQuery = graphql(`
  query IntegrationConnections {
    integrationConnections(excludeCategory: "ai") {
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
        mode
      }
    }
  }
`);

export const ProviderModelsQuery = graphql(`
  query ProviderModels($providerId: String!) {
    providerModels(providerId: $providerId) {
      id
      name
      mode
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

export const SetDefaultImageModelMutation = graphql(`
  mutation SetDefaultImageModel($providerId: String!, $modelId: String!) {
    setDefaultImageModel(providerId: $providerId, modelId: $modelId)
  }
`);

export const EnabledModelsQuery = graphql(`
  query EnabledModels($providerId: String!) {
    enabledModels(providerId: $providerId)
  }
`);

export const AllEnabledModelsQuery = graphql(`
  query AllEnabledModels {
    allEnabledModels {
      providerId
      modelId
      modelName
      modelMode
    }
  }
`);

export const EnableModelMutation = graphql(`
  mutation EnableModel($providerId: String!, $modelId: String!, $modelName: String) {
    enableModel(providerId: $providerId, modelId: $modelId, modelName: $modelName)
  }
`);

export const DisableModelMutation = graphql(`
  mutation DisableModel($providerId: String!, $modelId: String!) {
    disableModel(providerId: $providerId, modelId: $modelId)
  }
`);

export const BedrockEnabledModelsQuery = graphql(`
  query BedrockEnabledModels {
    bedrockEnabledModels
  }
`);

export const EnabledModelDetailsQuery = graphql(`
  query EnabledModelDetails($providerId: String!) {
    enabledModelDetails(providerId: $providerId) {
      id
      name
      mode
      maxInputTokens
      inputCostPerToken
      outputCostPerToken
      supportedModalities
      supportedOutputModalities
      inputCostPerImage
      inputCostPerImageToken
      outputCostPerImage
      outputCostPerImageToken
    }
  }
`);

export const BedrockAvailableModelsQuery = graphql(`
  query BedrockAvailableModels {
    bedrockAvailableModels {
      id
      name
      mode
    }
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
  ) {
    submitOAuthConnection(
      providerId: $providerId
      accessToken: $accessToken
      refreshToken: $refreshToken
      expiresAt: $expiresAt
      scopes: $scopes
      accountId: $accountId
      clientId: $clientId
    )
  }
`);
