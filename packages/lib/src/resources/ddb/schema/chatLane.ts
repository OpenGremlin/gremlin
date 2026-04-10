import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * Per-lane chat settings. The primary key is derived from agentId + lane
 * so there is exactly one record per conversation lane.
 *
 * `lane` is "main" for the agent's primary conversation or "task:{taskId}"
 * for task-specific lanes.
 */
export const ChatLaneEntity = new Entity({
  name: "ChatLane",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    lane: string(),
    clearedAt: string().optional(),
  }),
  computeKey: ({ id }) => ({
    pk: "CHAT_LANE",
    sk: `CHAT_LANE#${id}`,
  }),
});

export type ChatLaneItem = FormattedItem<typeof ChatLaneEntity>;

/** Deterministic id for a chat lane — one per agent + lane combination. */
export function chatLaneId(agentId: string, lane: string): string {
  return `${agentId}:${lane}`;
}
