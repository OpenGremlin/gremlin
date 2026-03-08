import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const ProfileEntity = new Entity({
  name: "Profile",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    name: string().key(),
    displayName: string(),
    about: string(),
    website: anyOf(string(), nul()),
    timezone: anyOf(string(), nul()).optional(),
  }),
  computeKey: ({ name }) => ({
    pk: "PROFILE",
    sk: `PROFILE#${name}`,
  }),
});

export type ProfileItem = FormattedItem<typeof ProfileEntity>;
