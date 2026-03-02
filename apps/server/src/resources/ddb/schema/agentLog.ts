import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { GremlinTable } from "../table.js";

export const AgentLogEntity = new Entity({
  name: "AgentLog",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    taskId: anyOf(string(), nul()),
    role: string(),
    content: string(),
    toolName: anyOf(string(), nul()).optional(),
    toolInput: anyOf(string(), nul()).optional(),
    toolResult: anyOf(string(), nul()).optional(),
    internal: boolean().optional().default(false),
    createdAt: string(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "AGENT_LOG",
    sk: `AGENT_LOG#${id}`,
  }),
});

export type AgentLogItem = FormattedItem<typeof AgentLogEntity>;
