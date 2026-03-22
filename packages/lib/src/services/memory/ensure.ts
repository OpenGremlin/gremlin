import {
  CreateIndexCommand,
  CreateVectorBucketCommand,
  ListIndexesCommand,
  ListVectorBucketsCommand,
} from "@aws-sdk/client-s3vectors";
import { logger } from "../../logger.js";
import type { ServiceContext } from "../context.js";

let initialized = false;

const INDEX_NAME = "memories";

export async function ensureVectorIndex(ctx: ServiceContext): Promise<void> {
  if (initialized) return;
  if (!ctx.resources.s3vectors) return;

  const { client, bucketName } = ctx.resources.s3vectors;

  // Check if bucket exists
  const { vectorBuckets } = await client.send(new ListVectorBucketsCommand({}));
  const bucketExists = vectorBuckets?.some(
    (b) => b.vectorBucketName === bucketName,
  );

  if (!bucketExists) {
    logger.info(
      { bucketName, component: "memory" },
      "Creating S3 Vectors bucket",
    );
    await client.send(
      new CreateVectorBucketCommand({ vectorBucketName: bucketName }),
    );
  }

  // Check if index exists
  const { indexes } = await client.send(
    new ListIndexesCommand({ vectorBucketName: bucketName }),
  );
  const indexExists = indexes?.some((i) => i.indexName === INDEX_NAME);

  if (!indexExists) {
    logger.info(
      { indexName: INDEX_NAME, component: "memory" },
      "Creating S3 Vectors index",
    );
    await client.send(
      new CreateIndexCommand({
        vectorBucketName: bucketName,
        indexName: INDEX_NAME,
        dataType: "float32",
        dimension: 1024,
        distanceMetric: "cosine",
        metadataConfiguration: {
          nonFilterableMetadataKeys: ["content", "date"],
        },
      }),
    );
  }

  initialized = true;
  logger.info({ component: "memory" }, "S3 Vectors index ready");
}
