import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const TaskEntity = new Entity({
  name: "Task",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    title: string(),
    status: string(),
    message: anyOf(string(), nul()),
    createdAt: string(),
    updatedAt: string(),
    completedAt: anyOf(string(), nul()),
    originJobId: anyOf(string(), nul()),
    artifacts: list(string()).default([]),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "TASK",
    sk: `TASK#${id}`,
  }),
});

export type TaskItem = FormattedItem<typeof TaskEntity>;
