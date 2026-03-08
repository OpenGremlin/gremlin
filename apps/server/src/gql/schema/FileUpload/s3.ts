import type { S3Client as S3ClientType } from "@aws-sdk/client-s3";

let _s3: S3ClientType | undefined;

export async function getS3Client(): Promise<S3ClientType> {
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

export function getUploadsBucketName(): string {
  const name = process.env.UPLOADS_BUCKET_NAME;
  if (!name) throw new Error("UPLOADS_BUCKET_NAME env var is not set");
  return name;
}
