import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";

export interface SafeConnectionMeta {
  accountId?: string;
  scopes?: string;
  expiresAt?: string;
  roleArn?: string;
  roleRegion?: string;
  displayName?: string;
}

export interface SafeIntegrationConnection {
  id: string;
  providerId: string;
  connectionType: string;
  connectedAt: string;
  isRevoked: boolean;
  connectionMeta: SafeConnectionMeta;
}

function stripSecrets(
  item: IntegrationConnectionItem,
): SafeIntegrationConnection {
  const { connectionMeta, ...base } = item;
  const safeMeta: SafeConnectionMeta = {
    accountId: connectionMeta?.accountId,
  };

  if (base.connectionType === "oauth") {
    safeMeta.scopes = connectionMeta?.scopes;
    safeMeta.expiresAt = connectionMeta?.expiresAt;
  }

  if (base.connectionType === "aws_iam_role") {
    safeMeta.roleArn = connectionMeta?.roleArn;
    safeMeta.roleRegion = connectionMeta?.roleRegion;
    safeMeta.displayName = connectionMeta?.displayName;
  }

  return { ...base, connectionMeta: safeMeta };
}

export async function getConnections(
  resources: Resources,
): Promise<SafeIntegrationConnection[]> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  return (Items as IntegrationConnectionItem[])
    .filter((item) => !item.isRevoked)
    .map(stripSecrets);
}
