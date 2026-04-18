import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * A bearer key authorizing a Webhook to POST events.
 * Stores only sha256(plaintext) — the plaintext is shown once at creation
 * and never persisted. Lookup by hash is a single GetItem.
 */
export const WebhookKeyEntity = new Entity({
  name: "WebhookKey",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    webhookId: string(),
    /** Hex-encoded sha256 of the plaintext key. Primary lookup attribute. */
    hash: string(),
    /** First ~16 chars of the plaintext, for UX display only. */
    prefix: string(),
    createdAt: string(),
    lastUsedAt: anyOf(string(), nul()),
    revokedAt: anyOf(string(), nul()),
  }),
  // pk by hash so the auth path is a single GetItem; gsi1 lists keys per webhook.
  computeKey: ({ id }) => ({
    pk: `WEBHOOK_KEY#${id}`,
    sk: "WEBHOOK_KEY",
  }),
});

export type WebhookKeyItem = FormattedItem<typeof WebhookKeyEntity>;
