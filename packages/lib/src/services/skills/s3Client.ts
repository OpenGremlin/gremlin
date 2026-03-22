import type { S3Client } from "@aws-sdk/client-s3";

let _s3: S3Client | undefined;
export async function getS3Client() {
  if (!_s3) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    _s3 = new S3Client({
      ...(process.env.LOCALSTACK_ENDPOINT && {
        endpoint: process.env.LOCALSTACK_ENDPOINT,
        forcePathStyle: true,
      }),
    });
  }
  return _s3;
}
