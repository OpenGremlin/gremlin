import { type DDBResource, ddb } from "./ddb/index.js";
import type { PubSub } from "./pubsub.js";
import { type S3VectorsResource, s3vectors } from "./s3vectors/index.js";

export interface Resources {
  ddb: DDBResource;
  pubsub: PubSub;
  s3vectors: S3VectorsResource;
}

export function createResources(pubsub: PubSub): Resources {
  return { ddb, pubsub, s3vectors };
}
