import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const SandboxVolumeEntity = new Entity({
  name: "SandboxVolume",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    agentId: string().key(),
    volumeId: string(),
    availabilityZone: string(),
    sizeGiB: number(),
    createdAt: string(),
    lastUsedAt: string(),
  }),
  computeKey: ({ agentId }) => ({
    pk: "SANDBOX_VOLUME",
    sk: `SANDBOX_VOLUME#${agentId}`,
  }),
});

export type SandboxVolumeItem = FormattedItem<typeof SandboxVolumeEntity>;
