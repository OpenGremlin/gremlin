import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";

export async function getProviderApiKey(
  resources: Resources,
  providerId: string,
): Promise<string | null> {
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const conn = (Items as IntegrationConnectionItem[]).find(
    (item) =>
      item.providerId === providerId &&
      (item.connectionType === "apikey" ||
        item.connectionType === "model_provider") &&
      !item.isRevoked,
  );

  return conn?.connectionMeta?.apiKey ?? null;
}
