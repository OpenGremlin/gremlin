import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * One row per active canvas cast session, scoped to a userId.
 * `currentAgentId` is mutable — mobile rebinds it via
 * /canvas/sessions/:id/bind without dropping the cast session.
 *
 * `ttl` is the Unix-epoch expiry (matches the table's TTL attribute name);
 * DynamoDB cleans up expired rows automatically.
 */
export const CanvasSessionEntity = new Entity({
  name: "CanvasSession",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    sessionId: string().key(),
    userId: string(),
    currentAgentId: string().optional(),
    createdAt: string(),
    ttl: number(),
  }),
  computeKey: ({ sessionId }) => ({
    pk: "CANVAS_SESSION",
    sk: `SESSION#${sessionId}`,
  }),
});

export type CanvasSessionItem = FormattedItem<typeof CanvasSessionEntity>;
