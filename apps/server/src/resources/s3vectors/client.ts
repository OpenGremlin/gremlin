import { S3VectorsClient } from "@aws-sdk/client-s3vectors";

export const s3VectorsClient = new S3VectorsClient({
  region: process.env.AWS_REGION,
});
