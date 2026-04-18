import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * A registered webhook: a named handle external services use to push events
 * into Gremlin under one or more topic patterns.
 */
export const WebhookEntity = new Entity({
  name: "Webhook",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    name: string(),
    /** Topic patterns this webhook may publish to, e.g. "gmail:*" or "serverhealth". */
    scopes: list(string()),
    createdAt: string(),
    revokedAt: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "WEBHOOK",
    sk: `WEBHOOK#${id}`,
  }),
});

export type WebhookItem = FormattedItem<typeof WebhookEntity>;
