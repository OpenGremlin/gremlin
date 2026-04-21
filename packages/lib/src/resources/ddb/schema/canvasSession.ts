import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * One row per active canvas cast session, scoped to a userId. The
 * `currentAgentId` is mutable: mobile rebinds it via /canvas/sessions/:id/bind
 * without dropping the cast session. Sessions auto-expire via DynamoDB TTL
 * on `expiresAtEpoch` (matches the canvas session token's exp claim).
 *
 * The token is validated by signature; we don't store it. `tokenHash` is
 * kept for explicit revocation (POST /end zeroes it; SSE attempts compare
 * and refuse mismatches).
 */
export const CanvasSessionEntity = new Entity({
  name: "CanvasSession",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    sessionId: string().key(),
    userId: string(),
    currentAgentId: string().optional(),
    tokenHash: string(),
    createdAt: string(),
    expiresAtEpoch: number(),
  }),
  computeKey: ({ sessionId }) => ({
    pk: "CANVAS_SESSION",
    sk: `SESSION#${sessionId}`,
  }),
});

export type CanvasSessionItem = FormattedItem<typeof CanvasSessionEntity>;
