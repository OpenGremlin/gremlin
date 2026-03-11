/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      connectionType\n      hasConnection\n    }\n  }\n": typeof types.IntegrationProvidersDocument,
    "\n  mutation SubmitOAuthConnection(\n    $providerId: String!\n    $accessToken: String!\n    $refreshToken: String\n    $expiresAt: String\n    $scopes: [String!]!\n    $accountId: String\n  ) {\n    submitOAuthConnection(\n      providerId: $providerId\n      accessToken: $accessToken\n      refreshToken: $refreshToken\n      expiresAt: $expiresAt\n      scopes: $scopes\n      accountId: $accountId\n    )\n  }\n": typeof types.SubmitOAuthConnectionDocument,
};
const documents: Documents = {
    "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      connectionType\n      hasConnection\n    }\n  }\n": types.IntegrationProvidersDocument,
    "\n  mutation SubmitOAuthConnection(\n    $providerId: String!\n    $accessToken: String!\n    $refreshToken: String\n    $expiresAt: String\n    $scopes: [String!]!\n    $accountId: String\n  ) {\n    submitOAuthConnection(\n      providerId: $providerId\n      accessToken: $accessToken\n      refreshToken: $refreshToken\n      expiresAt: $expiresAt\n      scopes: $scopes\n      accountId: $accountId\n    )\n  }\n": types.SubmitOAuthConnectionDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      connectionType\n      hasConnection\n    }\n  }\n"): typeof import('./graphql').IntegrationProvidersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitOAuthConnection(\n    $providerId: String!\n    $accessToken: String!\n    $refreshToken: String\n    $expiresAt: String\n    $scopes: [String!]!\n    $accountId: String\n  ) {\n    submitOAuthConnection(\n      providerId: $providerId\n      accessToken: $accessToken\n      refreshToken: $refreshToken\n      expiresAt: $expiresAt\n      scopes: $scopes\n      accountId: $accountId\n    )\n  }\n"): typeof import('./graphql').SubmitOAuthConnectionDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
