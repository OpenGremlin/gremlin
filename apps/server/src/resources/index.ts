import { type DDBResource, ddb } from "./ddb/index.js";
import { type PubSub, pubsub } from "./pubsub.js";
import { type S3VectorsResource, s3vectors } from "./s3vectors/index.js";

export interface Resources {
  ddb: DDBResource;
  pubsub: PubSub;
  s3vectors: S3VectorsResource;
}

export function createResources(): Resources {
  return { ddb, pubsub, s3vectors };
}
