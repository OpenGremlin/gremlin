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
    scheduledAt: string().key(),
    prompt: string(),
    active: boolean().key(),
    createdAt: string(),
  }),
  computeKey: ({ id, active, scheduledAt }) => ({
    pk: "TASK_FOLLOW_UP",
    sk: `TASK_FOLLOW_UP#${id}`,
    gsi1pk: active ? "FOLLOWUP_ACTIVE" : "FOLLOWUP_INACTIVE",
    gsi1sk: scheduledAt,
  }),
});

export type TaskFollowUpItem = FormattedItem<typeof TaskFollowUpEntity>;
