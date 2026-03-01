import { ddb, type DDBResource } from "./ddb/index.js";
import { pubsub, type PubSub } from "./pubsub.js";

export interface Resources {
  ddb: DDBResource;
  pubsub: PubSub;
}

export function createResources(): Resources {
  return { ddb, pubsub };
}
