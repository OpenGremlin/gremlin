import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const GoogleOAuthTokenEntity = new Entity({
  name: "GoogleOAuthToken",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    userId: string().key(),
    accessToken: string(),
    refreshToken: string(),
    expiresAt: string(),
    scopes: string(),
    email: string(),
    connectedAt: string(),
  }),
  computeKey: ({ userId }) => ({
    pk: `USER#${userId}`,
    sk: "GOOGLE_OAUTH",
  }),
});

export type GoogleOAuthTokenItem = FormattedItem<typeof GoogleOAuthTokenEntity>;
