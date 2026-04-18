import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const AgentEntity = new Entity({
  name: "Agent",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    name: string(),
    avatar: string(),
    portraitId: string(),
    hexColor: string().optional(),
    personality: string().optional(),
    role: string().optional(),
    // One-line hint shown to managers in their team roster when deciding
    // who to delegate a task to. Peer-LLM-readable — be specific.
    delegationHint: string().optional(),
    retired: boolean().optional().default(false),
    lastLogAt: string().optional(),
    sandboxInstanceId: string().optional(),
    ttsVoice: string().optional(),
    config: map({
      model: map({
        type: string(), // "bedrock" | "connection"
        modelId: string().optional(), // for bedrock
        connectionId: string().optional(), // for connection
      }).optional(),
      imageModel: map({
        type: string(),
        modelId: string().optional(),
        connectionId: string().optional(),
      }).optional(),
      speechModel: map({
        type: string(),
        modelId: string().optional(),
        connectionId: string().optional(),
      }).optional(),
      sandbox: map({
        enabled: boolean(),
        idleTimeoutMinutes: number().optional(),
        alwaysOn: boolean().optional(),
        commandApproval: string(),
      }).optional(),
      webSearch: map({
        enabled: boolean(),
        provider: string().optional(),
      }).optional(),
      reasoning: map({
        enabled: boolean(),
      }).optional(),
      viewImage: map({
        enabled: boolean(),
      }).optional(),
      imageGeneration: map({
        enabled: boolean(),
      }).optional(),
      speech: map({
        enabled: boolean(),
        voice: string().optional(),
      }).optional(),
      // Manager mode: when enabled, the agent can delegate well-scoped
      // tasks to its team via the `delegate` tool. The team is a flat
      // list of other agentIds the user has chosen to attach.
      manager: map({
        enabled: boolean(),
        team: list(string()),
      }).optional(),
    }).optional(),
  }),
  computeKey: ({ id }) => ({
    pk: "AGENT",
    sk: `AGENT#${id}`,
  }),
});

export type AgentItem = FormattedItem<typeof AgentEntity>;
