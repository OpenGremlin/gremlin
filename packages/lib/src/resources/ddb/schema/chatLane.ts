import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { ChatTable } from "../chatTable.js";

/**
 * Per-lane chat settings. The primary key is derived from agentId + lane
 * so there is exactly one record per conversation lane.
 *
 * `lane` is "main" for the agent's primary conversation or "task:{taskId}"
 * for task-specific lanes.
 */
export const ChatLaneEntity = new Entity({
  name: "ChatLane",
  table: ChatTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    lane: string(),
    clearedAt: string().optional(),
    // Rendered memory context string (core + recent journals). Reused across
    // turns within a session so the prompt prefix stays byte-stable, which
    // keeps Anthropic's rolling 5m cache warm. Refreshed when the snapshot
    // is older than SNAPSHOT_TTL_MS — see loadMemorySnapshot.
    memorySnapshot: string().optional(),
    memorySnapshotAt: string().optional(),
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
