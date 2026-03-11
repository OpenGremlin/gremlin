import { graphql } from "../generated/gql";

export const IntegrationProvidersQuery = graphql(`
  query IntegrationProviders {
    integrationProviders {
      id
      service
      connectionType
      hasConnection
    }
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
