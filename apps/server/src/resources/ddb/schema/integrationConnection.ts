import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { map } from "dynamodb-toolbox/schema/map";
import { SecretsTable } from "../secretsTable.js";

export const IntegrationConnectionEntity = new Entity({
  name: "IntegrationConnection",
  table: SecretsTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    providerId: string(),
    connectionType: string(),
    description: string(),
    connectedAt: string(),
    isRevoked: boolean().default(false),
    connectionMeta: map({
      accessToken: string().optional(),
      refreshToken: string().optional(),
      expiresAt: string().optional(),
      scopes: string().optional(),
      accountId: string().optional(),
      apiKey: string().optional(),
    }),
  }),
  computeKey: ({ id }) => ({
    pk: "INTEGRATION_CONNECTION",
    sk: `INTEGRATION_CONNECTION#${id}`,
  }),
});

export type IntegrationConnectionItem = FormattedItem<
  typeof IntegrationConnectionEntity
>;
