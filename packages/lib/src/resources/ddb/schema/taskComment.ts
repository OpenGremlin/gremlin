import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";

import { GremlinTable } from "../table.js";

/**
 * A comment / activity entry on a task.
 *
 * Primary key:
 *   pk  = "TASK_COMMENT#{taskId}"
 *   sk  = "COMMENT#{createdAt}#{id}"
 *
 * Sorting by sk gives chronological order within a task.
 */
export const TaskCommentEntity = new Entity({
  name: "TaskComment",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    taskId: string(),
    author: string(),
    text: string(),
    createdAt: string(),
  }),
  // pk/sk are written directly via PutCommand because computeKey only
  // receives key() fields (just `id`).  This stub satisfies dynamodb-toolbox.
  computeKey: ({ id }) => ({
    pk: `TASK_COMMENT#${id}`,
    sk: `COMMENT#${id}`,
  }),
});

export type TaskCommentItem = FormattedItem<typeof TaskCommentEntity>;
