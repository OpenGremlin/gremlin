import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { map } from "dynamodb-toolbox/schema/map";
import { string } from "dynamodb-toolbox/schema/string";
import { SecretsTable } from "../secretsTable.js";

export const IntegrationConnectionEntity = new Entity({
  name: "IntegrationConnection",
  table: SecretsTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    providerId: string(),
    connectionType: string(),
    connectedAt: string(),
    isRevoked: boolean().default(false),
    connectionMeta: map({
      accessToken: string().optional(),
      refreshToken: string().optional(),
      expiresAt: string().optional(),
      scopes: string().optional(),
      accountId: string().optional(),
      apiKey: string().optional(),
      clientId: string().optional(),
      clientSecret: string().optional(),
      tokenUrl: string().optional(),
      tokenAuthMethod: string().optional(),
      roleArn: string().optional(),
      roleRegion: string().optional(),
      displayName: string().optional(),
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
