import { graphql } from "../generated/gql";

export const ModelProvidersQuery = graphql(`
  query ModelProviders {
    modelProviders {
      id
      name
      hasApiKey
      models {
        id
        name
        contextWindow
        maxTokens
        reasoning
        inputCost
        outputCost
      }
    }
    activeModel {
      providerId
      modelId
    }
  }
`);

export const SetProviderApiKeyMutation = graphql(`
  mutation SetProviderApiKey($providerId: String!, $apiKey: String!) {
    setProviderApiKey(providerId: $providerId, apiKey: $apiKey)
  }
`);

export const RemoveProviderApiKeyMutation = graphql(`
  mutation RemoveProviderApiKey($providerId: String!) {
    removeProviderApiKey(providerId: $providerId)
  }
`);

export const SetActiveModelMutation = graphql(`
  mutation SetActiveModel($providerId: String!, $modelId: String!) {
    setActiveModel(providerId: $providerId, modelId: $modelId)
  }
`);
