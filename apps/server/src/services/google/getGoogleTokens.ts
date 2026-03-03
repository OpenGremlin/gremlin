import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export async function getGoogleAccessToken(
  resources: Resources,
  userId: string,
): Promise<string> {
  const { Item } = await resources.ddb.entities.OAuthToken.build(
    GetItemCommand,
  )
    .key({ userId, provider: "google" })
    .send();

  if (!Item) throw new Error("Google OAuth tokens not found for user");

  const expiresAt = new Date(Item.expiresAt).getTime();
  const now = Date.now();

  if (now < expiresAt - REFRESH_BUFFER_MS) {
    return Item.accessToken;
  }

  // Refresh the token
  const client = await getGoogleOAuthClient();
  client.setCredentials({ refresh_token: Item.refreshToken });
  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  const newExpiresAt = new Date(credentials.expiry_date ?? 0).toISOString();

  await resources.ddb.entities.OAuthToken.build(PutItemCommand)
    .item({
      ...Item,
      accessToken: credentials.access_token,
      expiresAt: newExpiresAt,
    })
    .send();

  return credentials.access_token;
}
