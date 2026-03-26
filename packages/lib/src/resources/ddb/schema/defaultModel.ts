import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const DefaultModelEntity = new Entity({
  name: "DefaultModel",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    modelType: string().key(),
    providerId: string(),
    modelId: string(),
    modelName: string().optional(),
  }),
  computeKey: ({ modelType }) => ({
    pk: "DEFAULT_MODEL",
    sk: `DEFAULT_MODEL#${modelType}`,
  }),
});

export type DefaultModelItem = FormattedItem<typeof DefaultModelEntity>;
