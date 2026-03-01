import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const StatusEntity = new Entity({
  name: "Status",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string().key(),
    title: string(),
    summary: string(),
    artifacts: list(
      map({ type: string(), title: string(), body: string() }),
    ),
    category: string(),
    completedAt: string().key(),
  }),
  computeKey: ({ id, agentId, completedAt }) => ({
    pk: "STATUS",
    sk: `STATUS#${id}`,
    gsi1pk: `STATUS_AGENT#${agentId}`,
    gsi1sk: completedAt,
  }),
});

export type StatusItem = FormattedItem<typeof StatusEntity>;
