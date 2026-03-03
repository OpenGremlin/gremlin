import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const SettingEntity = new Entity({
  name: "Setting",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    key: string().key(),
    value: string(),
  }),
  computeKey: ({ key }) => ({
    pk: "SETTING",
    sk: `SETTING#${key}`,
  }),
});

export type SettingItem = FormattedItem<typeof SettingEntity>;
