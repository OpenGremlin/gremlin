import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { GremlinTable } from "../table.js";

export const TaskFollowUpEntity = new Entity({
  name: "TaskFollowUp",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    taskId: string(),
    agentId: string(),
    scheduledAt: string(),
    prompt: string(),
    active: boolean(),
    createdAt: string(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand/UpdateCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "TASK_FOLLOW_UP",
    sk: `TASK_FOLLOW_UP#${id}`,
  }),
});

export type TaskFollowUpItem = FormattedItem<typeof TaskFollowUpEntity>;
