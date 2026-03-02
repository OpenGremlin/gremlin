import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
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
    timezone: anyOf(string(), nul()).optional(),
    agentId: string().default("clawd"),
    status: string(),
    lastRun: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "AGENT_JOB",
    sk: `AGENT_JOB#${id}`,
  }),
});

export type AgentJobItem = FormattedItem<typeof AgentJobEntity>;
