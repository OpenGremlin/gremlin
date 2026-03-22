import type { S3VectorsClient } from "@aws-sdk/client-s3vectors";
import { s3VectorsClient } from "./client.js";

export interface S3VectorsResource {
  client: S3VectorsClient;
  bucketName: string;
}

export const s3vectors: S3VectorsResource | null = process.env.VECTORS_BUCKET
  ? { client: s3VectorsClient, bucketName: process.env.VECTORS_BUCKET }
  : null;
