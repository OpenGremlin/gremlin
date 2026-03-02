import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const CronJobTriggerEntity = new Entity({
  name: "CronJobTrigger",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    jobId: string().key(),
    triggerTimeMs: string().key(),
    taskId: string(),
    createdAt: string(),
  }),
  computeKey: ({ jobId, triggerTimeMs }) => ({
    pk: `AGENT_JOB#${jobId}`,
    sk: `TRIGGER#${triggerTimeMs}`,
  }),
});

export type CronJobTriggerItem = FormattedItem<typeof CronJobTriggerEntity>;
