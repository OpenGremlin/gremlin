import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { GremlinTable } from "../table.js";

export const AgentLogEntity = new Entity({
  name: "AgentLog",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string().key(),
    taskId: anyOf(string(), nul()).key(),
    role: string(),
    content: string(),
    toolName: anyOf(string(), nul()).optional(),
    toolInput: anyOf(string(), nul()).optional(),
    toolResult: anyOf(string(), nul()).optional(),
    createdAt: string().key(),
  }),
  computeKey: ({ id, agentId, taskId, createdAt }) => ({
    pk: "AGENT_LOG",
    sk: `AGENT_LOG#${id}`,
    gsi1pk: taskId ? `LOG_TASK#${taskId}` : `LOG_AGENT#${agentId}`,
    gsi1sk: createdAt,
  }),
});

export type AgentLogItem = FormattedItem<typeof AgentLogEntity>;
