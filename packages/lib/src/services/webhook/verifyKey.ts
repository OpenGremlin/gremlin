import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { WebhookItem } from "../../resources/ddb/schema/webhook.js";
import type { WebhookKeyItem } from "../../resources/ddb/schema/webhookKey.js";
import type { Resources } from "../../resources/index.js";
import { hashKey } from "./keyFormat.js";

export interface VerifyKeyResult {
  webhook: WebhookItem;
  key: WebhookKeyItem;
}

/**
 * Looks up a plaintext bearer key, returns the matching Webhook + WebhookKey
 * if both are non-revoked, otherwise null.
 *
 * Auth path: caller treats `null` as 401.
 */
export async function verifyKey(
  resources: Resources,
  plaintext: string,
): Promise<VerifyKeyResult | null> {
  if (!plaintext) return null;
  const hash = hashKey(plaintext);

  const { Item: keyItem } = await resources.ddb.entities.WebhookKey.build(
    GetItemCommand,
  )
    .key({ id: hash })
    .send();
  if (!keyItem) return null;
  const key = keyItem as WebhookKeyItem;
  if (key.revokedAt) return null;

  const { Item: webhookItem } = await resources.ddb.entities.Webhook.build(
    GetItemCommand,
  )
    .key({ id: key.webhookId })
    .send();
  if (!webhookItem) return null;
  const webhook = webhookItem as WebhookItem;
  if (webhook.revokedAt) return null;

  return { webhook, key };
}

/**
 * Fire-and-forget update of the lastUsedAt timestamp on a key. Errors are
 * swallowed — auth already succeeded; a missed touch isn't worth a 5xx.
 */
export function touchKey(resources: Resources, keyId: string): void {
  resources.ddb.entities.WebhookKey.build(UpdateItemCommand)
    .item({ id: keyId, lastUsedAt: new Date().toISOString() })
    .send()
    .catch(() => {
      // intentionally ignored
    });
}
