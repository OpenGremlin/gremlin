import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { Resources } from "../../resources/index.js";

export interface InboundEvent {
  id: string;
  /** Anything else on the event becomes the payload. */
  [k: string]: unknown;
}

export interface IngestResult {
  accepted: number;
  deduped: number;
}

/**
 * Persist one or more events for a webhook. Dedupe is per (webhookId, eventId)
 * via a ConditionExpression, so retries that re-send the same id are silently
 * skipped.
 *
 * Writes are issued in parallel; per-event failures are isolated so one bad
 * event doesn't drop the rest of the batch.
 */
export async function ingestEvents(
  resources: Resources,
  input: { webhookId: string; topic: string; events: InboundEvent[] },
): Promise<IngestResult> {
  const table = resources.ddb.table;
  const tableName = table.getName();
  const docClient = table.getDocumentClient();
  const receivedAt = new Date().toISOString();

  let accepted = 0;
  let deduped = 0;

  await Promise.all(
    input.events.map(async (event) => {
      const { id, ...payload } = event;
      try {
        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              webhookId: input.webhookId,
              id,
              topic: input.topic,
              payload: JSON.stringify(payload),
              receivedAt,
              _et: "WebhookEvent",
              pk: `WEBHOOK_EVENT#${input.webhookId}`,
              sk: `WEBHOOK_EVENT#${id}`,
              // Per-topic index for future consumers
              gsi1pk: `WEBHOOK_EVENT_TOPIC#${input.topic}`,
              gsi1sk: `${receivedAt}#${id}`,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          }),
        );
        accepted += 1;
      } catch (err) {
        if (
          (err as { name?: string }).name === "ConditionalCheckFailedException"
        ) {
          deduped += 1;
        } else {
          throw err;
        }
      }
    }),
  );

  return { accepted, deduped };
}
