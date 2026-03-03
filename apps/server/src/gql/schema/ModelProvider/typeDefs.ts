export const modelProviderTypeDefs = /* GraphQL */ `
  type ModelInfo {
    id: ID!
    name: String!
    contextWindow: Int!
    maxTokens: Int!
    reasoning: Boolean!
    inputCost: Float
    outputCost: Float
  }

  type ModelProvider {
    id: ID!
    name: String!
    hasApiKey: Boolean!
    models: [ModelInfo!]!
  }

  type ActiveModel {
    providerId: String!
    modelId: String!
  }

  extend type Query {
    modelProviders: [ModelProvider!]!
    activeModel: ActiveModel
  }

  extend type Mutation {
    setProviderApiKey(providerId: String!, apiKey: String!): Boolean!
    removeProviderApiKey(providerId: String!): Boolean!
    setActiveModel(providerId: String!, modelId: String!): Boolean!
  }
`;
