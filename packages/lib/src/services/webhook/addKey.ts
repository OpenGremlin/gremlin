import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { WebhookKeyItem } from "../../resources/ddb/schema/webhookKey.js";
import type { ServiceContext } from "../context.js";
import { generateKey } from "./keyFormat.js";

export interface AddedKey extends WebhookKeyItem {
  /** Plaintext, returned exactly once. Never re-readable. */
  plaintext: string;
}

/**
 * Mints a new key for a webhook. Returns the row plus the plaintext (only time
 * it's exposed). The row id IS the sha256 hash, so auth is a single GetItem.
 */
export async function addKey(
  ctx: ServiceContext,
  webhookId: string,
): Promise<AddedKey> {
  const { plaintext, hash, prefix } = generateKey();
  const now = new Date().toISOString();

  const item: WebhookKeyItem = {
    id: hash,
    webhookId,
    hash,
    prefix,
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "WebhookKey",
        pk: `WEBHOOK_KEY#${hash}`,
        sk: "WEBHOOK_KEY",
        gsi1pk: `WEBHOOK_KEYS#${webhookId}`,
        gsi1sk: `WEBHOOK_KEY#${now}#${hash}`,
      },
    }),
  );

  return { ...item, plaintext };
}
