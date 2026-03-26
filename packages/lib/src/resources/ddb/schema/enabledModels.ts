import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const EnabledModelsEntity = new Entity({
  name: "EnabledModels",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    providerId: string().key(),
    models: list(
      map({
        id: string(),
        name: string(),
        mode: string(),
        maxInputTokens: number().optional(),
        inputCostPerToken: number().optional(),
        outputCostPerToken: number().optional(),
        supportedModalities: list(string()).optional(),
        supportedOutputModalities: list(string()).optional(),
        inputCostPerImage: number().optional(),
        inputCostPerImageToken: number().optional(),
        outputCostPerImage: number().optional(),
        outputCostPerImageToken: number().optional(),
      }),
    ).default([]),
  }),
  computeKey: ({ providerId }) => ({
    pk: "ENABLED_MODELS",
    sk: `ENABLED_MODELS#${providerId}`,
  }),
});

export type EnabledModelsItem = FormattedItem<typeof EnabledModelsEntity>;
