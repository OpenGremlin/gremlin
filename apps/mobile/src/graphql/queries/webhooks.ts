import { graphql } from "../generated/gql";

export const WebhooksQuery = graphql(`
  query Webhooks {
    webhooks {
      id
      name
      scopes
      createdAt
      revokedAt
      lastEventAt
      keys {
        id
        prefix
        createdAt
        lastUsedAt
        revokedAt
      }
    }
  }
`);

export const WebhookQuery = graphql(`
  query Webhook($id: ID!) {
    webhook(id: $id) {
      id
      name
      scopes
      createdAt
      revokedAt
      lastEventAt
      keys {
        id
        prefix
        createdAt
        lastUsedAt
        revokedAt
      }
    }
  }
`);

export const CreateWebhookMutation = graphql(`
  mutation CreateWebhook($name: String!, $scopes: [String!]!) {
    createWebhook(name: $name, scopes: $scopes) {
      webhook {
        id
        name
        scopes
        createdAt
      }
      key
      keyId
    }
  }
`);

export const UpdateWebhookScopesMutation = graphql(`
  mutation UpdateWebhookScopes($id: ID!, $scopes: [String!]!) {
    updateWebhookScopes(id: $id, scopes: $scopes) {
      id
      scopes
    }
  }
`);

export const RevokeWebhookMutation = graphql(`
  mutation RevokeWebhook($id: ID!) {
    revokeWebhook(id: $id) {
      id
      revokedAt
    }
  }
`);

export const AddWebhookKeyMutation = graphql(`
  mutation AddWebhookKey($webhookId: ID!) {
    addWebhookKey(webhookId: $webhookId) {
      webhook {
        id
        keys {
          id
          prefix
          createdAt
          lastUsedAt
          revokedAt
        }
      }
      key
      keyId
    }
  }
`);

export const RevokeWebhookKeyMutation = graphql(`
  mutation RevokeWebhookKey($webhookId: ID!, $keyId: ID!) {
    revokeWebhookKey(webhookId: $webhookId, keyId: $keyId) {
      id
      keys {
        id
        prefix
        createdAt
        lastUsedAt
        revokedAt
      }
    }
  }
`);
