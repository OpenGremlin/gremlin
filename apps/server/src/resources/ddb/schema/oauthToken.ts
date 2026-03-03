import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const OAuthTokenEntity = new Entity({
  name: "OAuthToken",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    userId: string().key(),
    provider: string().key(),
    accessToken: string(),
    refreshToken: string(),
    expiresAt: string(),
    scopes: string(),
    email: string(),
    connectedAt: string(),
  }),
  computeKey: ({ userId, provider }) => ({
    pk: `USER#${userId}`,
    sk: `OAUTH_TOKEN#${provider}`,
  }),
});

export type OAuthTokenItem = FormattedItem<typeof OAuthTokenEntity>;
