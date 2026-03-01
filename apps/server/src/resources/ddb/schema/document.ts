import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const DocumentEntity = new Entity({
  name: "Document",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    title: string(),
    body: string(),
    createdAt: string().key(),
    updatedAt: string(),
  }),
  computeKey: ({ id }) => ({
    pk: "DOCUMENT",
    sk: `DOCUMENT#${id}`,
  }),
});

export type DocumentItem = FormattedItem<typeof DocumentEntity>;
