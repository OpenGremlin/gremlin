import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const AgentEntity = new Entity({
  name: "Agent",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    name: string(),
    avatar: string(),
    portraitId: string(),
    soul: string(),
    blocked: boolean().optional().default(false),
    statusReason: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "AGENT",
    sk: `AGENT#${id}`,
  }),
});

export type AgentItem = FormattedItem<typeof AgentEntity>;
