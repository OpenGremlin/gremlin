import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";

export interface ConnectionInfo {
  id: string;
  label: string;
  isRevoked?: boolean;
}

/**
 * Load all integration connections and return only active (non-revoked) ones.
 * Also filters the given binding IDs to exclude revoked connections.
 */
export async function loadActiveConnectionLabels(
  resources: Resources,
  connectionIds: string[],
): Promise<ConnectionInfo[]> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  type ConnItem = IntegrationConnectionItem & {
    connectionMeta?: { accountId?: string };
  };
  const connMap = new Map((Items as ConnItem[]).map((c) => [c.id, c]));

  return connectionIds
    .map((id) => {
      const conn = connMap.get(id);
      if (!conn || conn.isRevoked) return null;
      const accountId = conn.connectionMeta?.accountId;
      return {
        id,
        label: accountId && accountId !== "unknown" ? accountId : id,
      };
    })
    .filter((c): c is ConnectionInfo => c !== null);
}

/**
 * Filter a bindings map to exclude revoked connection IDs.
 */
export async function filterRevokedBindings(
  resources: Resources,
  bindings: Record<string, string[]>,
): Promise<Record<string, string[]>> {
  const allIds = Object.values(bindings).flat();
  if (allIds.length === 0) return bindings;

  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const revokedIds = new Set(
    (Items as IntegrationConnectionItem[])
      .filter((c) => c.isRevoked)
      .map((c) => c.id),
  );

  // Also treat missing connections as revoked
  const knownIds = new Set((Items as IntegrationConnectionItem[]).map((c) => c.id));
  const result: Record<string, string[]> = {};
  for (const [provider, ids] of Object.entries(bindings)) {
    result[provider] = ids.filter((id) => knownIds.has(id) && !revokedIds.has(id));
  }
  return result;
}
