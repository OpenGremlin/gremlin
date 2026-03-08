import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";
import { refreshOAuthToken } from "./refreshToken.js";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a valid access token for the given provider.
 * Finds the first active OAuth connection and refreshes if needed.
 */
export async function getAccessToken(
  resources: Resources,
  providerId: string,
  _userId: string,
): Promise<string> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connection = (Items as IntegrationConnectionItem[]).find(
    (item) =>
      item.providerId === providerId &&
      item.connectionType === "oauth" &&
      !item.isRevoked &&
      item.connectionMeta?.accessToken,
  );

  if (!connection) {
    throw new Error(`${providerId} OAuth connection not found`);
  }

  const meta = connection.connectionMeta;
  const expiresAt = new Date(meta.expiresAt ?? 0).getTime();
  const now = Date.now();

  // Return current token if not expired
  if (now < expiresAt - REFRESH_BUFFER_MS) {
    return meta.accessToken as string;
  }

  // No refresh token — return current (may be expired, some providers don't expire)
  if (!meta.refreshToken) {
    return meta.accessToken as string;
  }

  const result = await refreshOAuthToken(providerId, meta.refreshToken);

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      ...connection,
      connectionMeta: {
        ...meta,
        accessToken: result.accessToken,
        expiresAt: result.accessTokenExpiresAt?.toISOString() ?? meta.expiresAt,
        // Some providers rotate refresh tokens (e.g. Jira)
        ...(result.refreshToken ? { refreshToken: result.refreshToken } : {}),
      },
    })
    .send();

  return result.accessToken;
}
