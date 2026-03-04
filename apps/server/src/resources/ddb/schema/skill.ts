import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const SkillEntity = new Entity({
  name: "Skill",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    name: string(),
    description: string(),
    version: string(),
    author: string(),
    installed: boolean(),
    category: string(),
    homepage: anyOf(string(), nul()),
    requiredEnv: list(string()),
  }),
  computeKey: ({ id }) => ({
    pk: "SKILL",
    sk: `SKILL#${id}`,
  }),
});

export type SkillItem = FormattedItem<typeof SkillEntity>;
