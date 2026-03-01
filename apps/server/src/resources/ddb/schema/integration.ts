import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { GremlinTable } from "../table.js";

export const IntegrationEntity = new Entity({
  name: "Integration",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    service: string(),
    icon: string(),
    description: string(),
    account: string(),
    connectedAt: string(),
    authMethod: string(),
    permissions: list(
      map({
        scope: string(),
        label: string(),
        enabled: boolean(),
      }),
    ),
  }),
  computeKey: ({ id }) => ({
    pk: "INTEGRATION",
    sk: `INTEGRATION#${id}`,
  }),
});

export type IntegrationItem = FormattedItem<typeof IntegrationEntity>;
