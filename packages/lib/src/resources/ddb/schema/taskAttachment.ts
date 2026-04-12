import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";

import { GremlinTable } from "../table.js";

/**
 * Standalone attachment item with its own UUID primary key.
 *
 * Primary key:
 *   pk  = "ATTACHMENT"
 *   sk  = "ATTACHMENT#{id}"
 *
 * GSI1 — query by task:
 *   gsi1pk = "TASK_ATTACHMENT#{taskId}"
 *   gsi1sk = "{createdAt}"
 *
 * GSI2 — query by file path (file attachments only):
 *   gsi2pk = "ATTACHMENT_FILE"
 *   gsi2sk = "{path}"
 *   → enables `begins_with` queries for both single-file and directory moves.
 *   → path is NOT in pk/sk, so moves are in-place UpdateCommand.
 */
export const TaskAttachmentEntity = new Entity({
  name: "TaskAttachment",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    taskId: string(),
    /** "file" | "link" */
    type: string(),
    // File attachments
    path: string().optional(),
    // Link attachments
    url: string().optional(),
    title: string().optional(),
    description: string().optional(),
    createdAt: string(),
  }),
  computeKey: ({ id }) => ({
    pk: "ATTACHMENT",
    sk: `ATTACHMENT#${id}`,
  }),
});

export type TaskAttachmentItem = FormattedItem<typeof TaskAttachmentEntity>;
