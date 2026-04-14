import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";

import { GremlinTable } from "../table.js";

/**
 * Dependency edge between two tasks.
 *
 * Primary key — forward lookup (what does taskId depend on?):
 *   pk  = "TASK_DEP#{taskId}"
 *   sk  = "DEP#{dependsOnId}"
 *
 * GSI1 — reverse lookup (what depends on dependsOnId?):
 *   gsi1pk = "TASK_DEPREV#{dependsOnId}"
 *   gsi1sk = "DEP#{taskId}"
 */
export const TaskDependencyEntity = new Entity({
  name: "TaskDependency",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    taskId: string().key(),
    dependsOnId: string().key(),
    depType: string().default("blocks"),
    createdAt: string(),
    createdBy: string(),
  }),
  computeKey: ({ taskId, dependsOnId }) => ({
    pk: `TASK_DEP#${taskId}`,
    sk: `DEP#${dependsOnId}`,
  }),
});

export type TaskDependencyItem = FormattedItem<typeof TaskDependencyEntity>;
