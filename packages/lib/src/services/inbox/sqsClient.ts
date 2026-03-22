import type { SQSClient } from "@aws-sdk/client-sqs";

let _sqs: SQSClient | undefined;
export async function getSqsClient() {
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
