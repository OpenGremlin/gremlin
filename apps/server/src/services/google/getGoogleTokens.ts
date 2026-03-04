import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a valid Google access token. Finds the first active Google OAuth
 * connection and refreshes the token if needed.
 */
export async function getGoogleAccessToken(
  resources: Resources,
  userId: string,
): Promise<string> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connection = (Items as IntegrationConnectionItem[]).find(
    (item) =>
      item.providerId === "google" &&
      item.connectionType === "oauth" &&
      !item.isRevoked &&
      item.connectionMeta?.accessToken,
  );

  if (!connection) {
    throw new Error("Google OAuth connection not found");
  }

  const meta = connection.connectionMeta;
  const expiresAt = new Date(meta.expiresAt ?? 0).getTime();
  const now = Date.now();

  if (now < expiresAt - REFRESH_BUFFER_MS) {
    return meta.accessToken!;
  }

  // Refresh the token
  const client = await getGoogleOAuthClient();
  client.setCredentials({ refresh_token: meta.refreshToken });
  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  const newExpiresAt = new Date(credentials.expiry_date ?? 0).toISOString();

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      ...connection,
      connectionMeta: {
        ...meta,
        accessToken: credentials.access_token,
        expiresAt: newExpiresAt,
      },
    })
    .send();

  return credentials.access_token;
}
