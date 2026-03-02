import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { nul } from "dynamodb-toolbox/schema/nul";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
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
    timezone: anyOf(string(), nul()),
  }),
  computeKey: ({ name }) => ({
    pk: "PROFILE",
    sk: `PROFILE#${name}`,
  }),
});

export type ProfileItem = FormattedItem<typeof ProfileEntity>;
