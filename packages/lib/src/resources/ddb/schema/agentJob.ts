import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const AgentJobEntity = new Entity({
  name: "AgentJob",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    name: string(),
    description: string(),
    recurrence: string(),
    cronExpression: anyOf(string(), nul()).optional(),
    timezone: string(),
    agentId: string(),
    paused: boolean().optional().default(false),
    lastRun: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "AGENT_JOB",
    sk: `AGENT_JOB#${id}`,
  }),
});

export type AgentJobItem = FormattedItem<typeof AgentJobEntity>;
