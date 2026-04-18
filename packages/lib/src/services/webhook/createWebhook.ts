import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { WebhookItem } from "../../resources/ddb/schema/webhook.js";
import type { ServiceContext } from "../context.js";
import { addKey } from "./addKey.js";
import { isValidScopePattern } from "./validation.js";

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateWebhookId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < bytes.length; i++) {
    id += ID_CHARS[bytes[i] % ID_CHARS.length];
  }
  return id;
}

export interface CreateWebhookResult {
  webhook: WebhookItem;
  keyId: string;
  keyPlaintext: string;
}

export async function createWebhook(
  ctx: ServiceContext,
  input: { name: string; scopes: string[] },
): Promise<CreateWebhookResult> {
  if (!input.name.trim()) throw new Error("Webhook name must not be empty");
  if (input.scopes.length === 0) {
    throw new Error("Webhook must have at least one scope");
  }
  for (const s of input.scopes) {
    if (!isValidScopePattern(s)) {
      throw new Error(`Invalid scope pattern: '${s}'`);
    }
  }
  const id = generateWebhookId();
  const now = new Date().toISOString();
  const item: WebhookItem = {
    id,
    name: input.name,
    scopes: input.scopes,
    createdAt: now,
    revokedAt: null,
  };

  await ctx.resources.ddb.entities.Webhook.build(PutItemCommand)
    .item(item)
    .send();

  const key = await addKey(ctx, id);

  return {
    webhook: item,
    keyId: key.id,
    keyPlaintext: key.plaintext,
  };
}
