import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type { ServiceContext } from "../context.js";
import { ringDoorbell } from "./consumer.js";

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
    ctx.log.info("No DOORBELL_QUEUE_URL — using in-process doorbell");
    return () => {};
  }

  ctx.log.info("Starting SQS worker");
  const sqs = new SQSClient({});
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

            ctx.log.info({ agentId }, "SQS doorbell received");

            // Ack immediately — inbox is source of truth
            await sqs.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              }),
            );

            const doorbellLog = ctx.log.child({
              doorbellId: crypto.randomUUID(),
              agentId,
            });

            // Fire-and-forget — ringDoorbell handles errors
            ringDoorbell({ ...ctx, log: doorbellLog }, agentId).catch((err) =>
              doorbellLog.error({ err }, "SQS doorbell failed"),
            );
          }),
        );
      } catch (err) {
        if (!shuttingDown) {
          ctx.log.error({ err }, "SQS poll error");
          // Back off on error
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    }
  };

  poll();

  return () => {
    ctx.log.info("Stopping SQS worker");
    shuttingDown = true;
  };
}
