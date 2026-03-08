import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { SecretsTable } from "../secretsTable.js";

export const ModelProviderKeyEntity = new Entity({
  name: "ModelProviderKey",
  table: SecretsTable,
  timestamps: false,
  schema: item({
    providerId: string().key(),
    apiKey: string(),
    createdAt: string(),
  }),
  computeKey: ({ providerId }) => ({
    pk: "MODEL_PROVIDER_KEY",
    sk: `MODEL_PROVIDER_KEY#${providerId}`,
  }),
});

export type ModelProviderKeyItem = FormattedItem<typeof ModelProviderKeyEntity>;
