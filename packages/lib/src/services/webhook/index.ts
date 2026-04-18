import { addKey } from "./addKey.js";
import { createWebhook } from "./createWebhook.js";
import { getWebhook } from "./getWebhook.js";
import { ingestEvents } from "./ingestEvents.js";
import { listKeys } from "./listKeys.js";
import { listWebhooks } from "./listWebhooks.js";
import { revokeKey } from "./revokeKey.js";
import { revokeWebhook } from "./revokeWebhook.js";
import { scopeMatch } from "./scopeMatch.js";
import { updateScopes } from "./updateScopes.js";
import {
  isValidScopePattern,
  isValidTopic,
  MAX_EVENTS_PER_BATCH,
} from "./validation.js";
import { touchKey, verifyKey } from "./verifyKey.js";

export const webhookService = {
  createWebhook,
  addKey,
  revokeKey,
  revokeWebhook,
  updateScopes,
  listWebhooks,
  getWebhook,
  listKeys,
  verifyKey,
  touchKey,
  ingestEvents,
  scopeMatch,
  isValidTopic,
  isValidScopePattern,
  MAX_EVENTS_PER_BATCH,
};

export type WebhookService = typeof webhookService;
