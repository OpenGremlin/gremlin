import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { string } from "dynamodb-toolbox/schema/string";

import { GremlinTable } from "../table.js";

export const PostEntity = new Entity({
  name: "Post",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    taskId: string(),
    title: string(),
    message: string(),
    /** TaskAttachment IDs collected from the task tree. */
    attachmentIds: list(string()),
    createdAt: string(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk, gsi2pk/gsi2sk) are written directly via
  // AWS SDK PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: `POST#${id}`,
    sk: "POST",
  }),
});

export type PostItem = FormattedItem<typeof PostEntity>;
