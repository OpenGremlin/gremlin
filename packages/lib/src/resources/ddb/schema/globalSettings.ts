import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const GlobalSettingsEntity = new Entity({
  name: "GlobalSettings",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key().default("global"),
    signupDisabled: boolean().default(false),
  }),
  computeKey: ({ id }) => ({
    pk: "GLOBAL_SETTINGS",
    sk: `GLOBAL_SETTINGS#${id}`,
  }),
});

export type GlobalSettingsItem = FormattedItem<typeof GlobalSettingsEntity>;
