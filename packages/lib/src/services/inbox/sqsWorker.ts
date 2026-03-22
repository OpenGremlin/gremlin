import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import type { ServiceContext } from "../context.js";
import { ringDoorbell } from "./consumer.js";
import { handleScheduleEvent } from "./handleScheduleEvent.js";
import { getSqsClient } from "./sqsClient.js";

/**
 * Start long-polling SQS for doorbell messages.
 * Each message contains { agentId, lane } — we ack immediately and
 * let ringDoorbell handle the drain loop for that lane.
 *
 * Only starts if DOORBELL_SQS_URL is set (deployed environment).
 * Returns a cleanup function to stop polling.
 */
export function startSqsWorker(ctx: ServiceContext): () => void {
  const queueUrl = process.env.DOORBELL_SQS_URL;
  if (!queueUrl) {
    ctx.log.info("No DOORBELL_SQS_URL — using in-process doorbell");
    return () => {};
  }

  ctx.log.info("Starting SQS worker");
  let shuttingDown = false;

  const poll = async () => {
    const sqs = await getSqsClient();
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
            const body = JSON.parse(msg.Body ?? "{}");

            // Ack immediately — inbox is source of truth
            await sqs.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              }),
            );

            // Schedule events have a `type` field; doorbell messages have agentId + lane
            if (body.type) {
              ctx.log.info({ type: body.type }, "SQS schedule event received");
              const scheduleLog = ctx.log.child({
                scheduleId: crypto.randomUUID(),
                type: body.type,
              });
              await handleScheduleEvent({ ...ctx, log: scheduleLog }, body);
              return;
            }

            const { agentId, lane } = body;
            if (!agentId || !lane) return;

            ctx.log.info({ agentId, lane }, "SQS doorbell received");

            const doorbellLog = ctx.log.child({
              doorbellId: crypto.randomUUID(),
              agentId,
              lane,
            });

            // Fire-and-forget — ringDoorbell handles errors
            ringDoorbell({ ...ctx, log: doorbellLog }, agentId, lane).catch(
              (err) => doorbellLog.error({ err }, "SQS doorbell failed"),
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
