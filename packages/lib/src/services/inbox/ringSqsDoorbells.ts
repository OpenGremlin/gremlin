import type { SQSClient as SQSClientType } from "@aws-sdk/client-sqs";
import type { ServiceContext } from "../context.js";

let _sqs: SQSClientType | undefined;
async function getSqsClient() {
  if (!_sqs) {
    const { SQSClient } = await import("@aws-sdk/client-sqs");
    _sqs = new SQSClient({
      ...(process.env.LOCALSTACK_ENDPOINT && {
        endpoint: process.env.LOCALSTACK_ENDPOINT,
      }),
    });
  }
  return _sqs;
}

/**
 * Ring the SQS doorbell for each agent ID, notifying the consumer
 * that there is work to process.
 */
export async function ringSqsDoorbells(
  ctx: ServiceContext,
  agentIds: string[],
): Promise<void> {
  const queueUrl = process.env.DOORBELL_QUEUE_URL;
  if (!queueUrl) {
    ctx.log.warn("DOORBELL_QUEUE_URL not set, skipping doorbell ring");
    return;
  }

  const { SendMessageCommand } = await import("@aws-sdk/client-sqs");
  const sqs = await getSqsClient();

  await Promise.all(
    agentIds.map((agentId) =>
      sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({ agentId }),
        }),
      ),
    ),
  );
}
