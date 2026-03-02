import { ddb, type DDBResource } from "./ddb/index.js";
import { pubsub, type PubSub } from "./pubsub.js";
import { s3vectors, type S3VectorsResource } from "./s3vectors/index.js";

export interface Resources {
  ddb: DDBResource;
  pubsub: PubSub;
  s3vectors: S3VectorsResource;
}

export function createResources(): Resources {
  return { ddb, pubsub, s3vectors };
}
