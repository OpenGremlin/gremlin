import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { string } from "dynamodb-toolbox/schema/string";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { GremlinTable } from "../table.js";

export const TaskEntity = new Entity({
  name: "Task",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string().key(),
    title: string(),
    status: string(),
    message: anyOf(string(), nul()),
    createdAt: string().key(),
    updatedAt: string(),
    completedAt: anyOf(string(), nul()),
    originJobId: anyOf(string(), nul()),
    artifacts: list(string()).optional(),
  }),
  computeKey: ({ id, agentId, createdAt }) => ({
    pk: "TASK",
    sk: `TASK#${id}`,
    gsi1pk: `TASK_AGENT#${agentId}`,
    gsi1sk: createdAt,
  }),
});

export type TaskItem = FormattedItem<typeof TaskEntity>;
