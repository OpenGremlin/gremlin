import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import { createLogger } from "../../logger.js";
import type { Resources } from "../../resources/index.js";

const log = createLogger("oauth:token");

/** Buffer before expiry to trigger a refresh (5 minutes) */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Get a valid access token for the given provider.
 * Finds the first active OAuth connection and returns the stored token.
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

  return connection.connectionMeta.accessToken as string;
}

/**
 * Get a valid access token for a specific connection by ID.
 * If the token is expired and a refresh token + credentials are available,
 * performs an OAuth refresh grant and updates the stored tokens.
 */
export async function getAccessTokenForConnection(
  resources: Resources,
  connectionId: string,
): Promise<string> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connection = (Items as IntegrationConnectionItem[]).find(
    (item) =>
      item.id === connectionId &&
      item.connectionType === "oauth" &&
      !item.isRevoked &&
      item.connectionMeta?.accessToken,
  );

  if (!connection) {
    throw new Error(`OAuth connection ${connectionId} not found or revoked`);
  }

  const meta = connection.connectionMeta;

  // Check if token is expired or about to expire
  if (meta.expiresAt && meta.refreshToken && meta.tokenUrl && meta.clientId && meta.clientSecret) {
    const expiresAt = new Date(meta.expiresAt).getTime();
    if (Date.now() >= expiresAt - EXPIRY_BUFFER_MS) {
      log.info({ connectionId, expiresAt: meta.expiresAt }, "Token expired, refreshing");
      return refreshAndStore(resources, connection);
    }
  }

  return meta.accessToken as string;
}

/**
 * Perform an OAuth refresh_token grant and update the stored connection.
 */
async function refreshAndStore(
  resources: Resources,
  connection: IntegrationConnectionItem,
): Promise<string> {
  const meta = connection.connectionMeta;
  const { refreshToken, tokenUrl, clientId, clientSecret, tokenAuthMethod } = meta;

  if (!refreshToken || !tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      `Cannot refresh OAuth connection ${connection.id}: missing credentials`,
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (tokenAuthMethod === "basic") {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    log.error(
      { connectionId: connection.id, status: res.status, body: text },
      "OAuth token refresh failed",
    );
    throw new Error(`OAuth token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token ?? refreshToken;
  const newExpiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : undefined;

  log.info(
    { connectionId: connection.id, expiresIn: data.expires_in },
    "OAuth token refreshed successfully",
  );

  // Update stored tokens — overwrite the full item to avoid nested map update issues
  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      ...connection,
      connectionMeta: {
        ...meta,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt ?? meta.expiresAt,
      },
    })
    .send();

  return newAccessToken;
}
