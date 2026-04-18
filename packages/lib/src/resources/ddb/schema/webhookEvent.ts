import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * A single event posted to a Webhook. Sender-supplied `id` deduplicates retries
 * within a (webhookId, id) namespace.
 *
 * `payload` is a JSON-stringified blob — event shapes vary per topic and we
 * don't validate them on ingest.
 *
 * Writes use raw PutCommand with a ConditionExpression so dedupe is atomic
 * and so we can also set GSI1 keys (gsi1pk: WEBHOOK_EVENT_TOPIC#<topic>,
 * gsi1sk: <receivedAt>#<id>) for future per-topic consumer queries.
 */
export const WebhookEventEntity = new Entity({
  name: "WebhookEvent",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    webhookId: string().key(),
    id: string().key(),
    topic: string(),
    payload: string(),
    receivedAt: string(),
  }),
  computeKey: ({ webhookId, id }) => ({
    pk: `WEBHOOK_EVENT#${webhookId}`,
    sk: `WEBHOOK_EVENT#${id}`,
  }),
});

export type WebhookEventItem = FormattedItem<typeof WebhookEventEntity>;
