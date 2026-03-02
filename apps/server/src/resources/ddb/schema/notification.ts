import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { GremlinTable } from "../table.js";

export const NotificationEntity = new Entity({
  name: "Notification",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    type: string(),
    turnId: anyOf(string(), nul()),
    message: string(),
    actions: list(
      map({
        id: string(),
        label: string(),
        style: string(),
      }),
    ),
    status: string(),
    resolvedAction: anyOf(string(), nul()),
    createdAt: string(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "NOTIFICATION",
    sk: `NOTIFICATION#${id}`,
  }),
});

export type NotificationItem = FormattedItem<typeof NotificationEntity>;
