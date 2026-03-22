import { createLogger } from "../logger.js";
import { type DDBResource, ddb } from "./ddb/index.js";
import type { PubSub } from "./pubsub.js";
import { type S3VectorsResource, s3vectors } from "./s3vectors/index.js";

const log = createLogger("resources");

export interface Resources {
  ddb: DDBResource;
  pubsub: PubSub;
  s3vectors: S3VectorsResource | null;
}

export function createResources(pubsub: PubSub): Resources {
  if (!s3vectors) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("VECTORS_BUCKET must be set in production");
    }
    log.warn("VECTORS_BUCKET not set — agent memory features will be disabled");
  }
  return { ddb, pubsub, s3vectors };
}
