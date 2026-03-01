import { ddb, type DDBResource } from "./ddb/index.js";

export interface Resources {
  ddb: DDBResource;
}

export function createResources(): Resources {
  return { ddb };
}
