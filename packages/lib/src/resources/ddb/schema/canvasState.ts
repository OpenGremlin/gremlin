import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * The last A2UI tree an agent surfaced to the canvas. Keyed by
 * (agentId, userId) — survives across cast sessions so re-casting
 * picks up where we left off. `tree` is JSON-stringified per the
 * CanvasTree type in services/canvas.
 *
 * TTL (`ttl`) is 30 days from last update so abandoned agent canvases
 * don't accumulate forever.
 */
export const CanvasStateEntity = new Entity({
  name: "CanvasState",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    agentId: string().key(),
    userId: string().key(),
    revision: number(),
    tree: string(),
    updatedAt: string(),
    ttl: number(),
  }),
  computeKey: ({ agentId, userId }) => ({
    pk: "CANVAS_STATE",
    sk: `CANVAS#${agentId}#${userId}`,
  }),
});

export type CanvasStateItem = FormattedItem<typeof CanvasStateEntity>;
