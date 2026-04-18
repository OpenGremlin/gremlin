export const webhookTypeDefs = /* GraphQL */ `
  type Webhook {
    id: ID!
    name: String!
    "Topic patterns this webhook may publish to (exact strings or trailing-wildcard prefixes like 'gmail:*')."
    scopes: [String!]!
    createdAt: String!
    revokedAt: String
    keys: [WebhookKey!]!
    "ISO timestamp of the most recent key use (max(key.lastUsedAt))."
    lastEventAt: String
  }

  type WebhookKey {
    "Opaque identifier (sha256 of the plaintext key). Pass to revokeWebhookKey."
    id: ID!
    "Truncated plaintext for UI display, e.g. 'grm_whk_aB3xK9…'. Never the full key."
    prefix: String!
    createdAt: String!
    lastUsedAt: String
    revokedAt: String
  }

  type CreateWebhookResult {
    webhook: Webhook!
    "Plaintext key — shown exactly once. Store it now."
    key: String!
    keyId: ID!
  }

  type AddWebhookKeyResult {
    webhook: Webhook!
    key: String!
    keyId: ID!
  }

  extend type Query {
    webhooks: [Webhook!]!
    webhook(id: ID!): Webhook
  }

  extend type Mutation {
    createWebhook(name: String!, scopes: [String!]!): CreateWebhookResult!
    updateWebhookScopes(id: ID!, scopes: [String!]!): Webhook!
    revokeWebhook(id: ID!): Webhook!
    addWebhookKey(webhookId: ID!): AddWebhookKeyResult!
    revokeWebhookKey(webhookId: ID!, keyId: ID!): Webhook!
  }
`;
