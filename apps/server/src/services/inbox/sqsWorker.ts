import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type { ServiceContext } from "../context.js";
import { ringDoorbell } from "./consumer.js";

const sqs = new SQSClient({});

/**
 * Start long-polling SQS for doorbell messages.
 * Each message contains { agentId } — we ack immediately and
 * let ringDoorbell handle the drain loop.
 *
 * Only starts if DOORBELL_QUEUE_URL is set (deployed environment).
 * Returns a cleanup function to stop polling.
 */
export function startSqsWorker(ctx: ServiceContext): () => void {
  const queueUrl = process.env.DOORBELL_QUEUE_URL;
  if (!queueUrl) {
    console.log("[inbox] No DOORBELL_QUEUE_URL — using in-process doorbell");
    return () => {};
  }

  console.log("[inbox] Starting SQS worker");
  let shuttingDown = false;

  const poll = async () => {
    while (!shuttingDown) {
      try {
        const resp = await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
          }),
        );

        const messages = resp.Messages ?? [];
        await Promise.all(
          messages.map(async (msg) => {
            const { agentId } = JSON.parse(msg.Body ?? "{}");
            if (!agentId) return;

            // Ack immediately — inbox is source of truth
            await sqs.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              }),
            );

            // Fire-and-forget — ringDoorbell handles errors
            ringDoorbell(ctx, agentId).catch((err) =>
              console.error(
                `[inbox] SQS doorbell failed for agent ${agentId}:`,
                err,
              ),
            );
          }),
        );
      } catch (err) {
        if (!shuttingDown) {
          console.error("[inbox] SQS poll error:", err);
          // Back off on error
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    }
  };

  poll();

  return () => {
    console.log("[inbox] Stopping SQS worker");
    shuttingDown = true;
  };
}
