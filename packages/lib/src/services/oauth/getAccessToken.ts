import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";

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

  return connection.connectionMeta.accessToken as string;
}
