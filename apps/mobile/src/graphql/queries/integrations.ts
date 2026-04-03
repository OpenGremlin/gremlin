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
    defaultSpeechModel {
      providerId
      modelId
      modelName
    }
  }
`);

export const IntegrationConnectionsQuery = graphql(`
  query IntegrationConnections {
    integrationConnections(excludeCategory: "ai") {
      ...IntegrationConnectionFields
    }
  }
`);

export const AwsSetupQuery = graphql(`
  query AwsSetup {
    awsPresetRoles {
      id
      name
      description
      roleArn
    }
    awsSetupInfo {
      trustPolicy
    }
  }
`);

export const ConnectAwsIamRoleMutation = graphql(`
  mutation ConnectAwsIamRole($roleArn: String!, $displayName: String, $region: String) {
    connectAwsIamRole(roleArn: $roleArn, displayName: $displayName, region: $region) {
      ...IntegrationConnectionFields
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
    revokeIntegrationConnection(id: $id) {
      ...IntegrationConnectionFields
    }
  }
`);

export const SetDefaultModelMutation = graphql(`
  mutation SetDefaultModel($providerId: String!, $modelId: String!) {
    setDefaultModel(providerId: $providerId, modelId: $modelId) {
      providerId
      modelId
      modelName
    }
  }
`);

export const SetDefaultImageModelMutation = graphql(`
  mutation SetDefaultImageModel($providerId: String!, $modelId: String!) {
    setDefaultImageModel(providerId: $providerId, modelId: $modelId) {
      providerId
      modelId
      modelName
    }
  }
`);

export const SetDefaultSpeechModelMutation = graphql(`
  mutation SetDefaultSpeechModel($providerId: String!, $modelId: String!) {
    setDefaultSpeechModel(providerId: $providerId, modelId: $modelId) {
      providerId
      modelId
      modelName
    }
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
    enableModel(providerId: $providerId, modelId: $modelId, modelName: $modelName) {
      providerId
      modelId
      modelName
      modelMode
    }
  }
`);

export const DisableModelMutation = graphql(`
  mutation DisableModel($providerId: String!, $modelId: String!) {
    disableModel(providerId: $providerId, modelId: $modelId) {
      providerId
      modelId
      modelName
      modelMode
    }
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
      supportsReasoning
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
    ) {
      ...IntegrationConnectionFields
    }
  }
`);
