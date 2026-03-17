import { randomUUID } from "node:crypto";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import {
  listProviderModels,
  type ProviderModel,
} from "./listProviderModels.js";
import { providers } from "./providers.js";

export interface ConnectApiKeyResult {
  connectionId: string;
  models: ProviderModel[];
}

export async function connectApiKey(
  resources: Resources,
  providerId: string,
  apiKey: string,
): Promise<ConnectApiKeyResult> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);
  if (def.connectionType !== "apikey") {
    throw new Error(
      `Provider "${providerId}" does not support API key connections`,
    );
  }

  // Validate the key by fetching models — throws on invalid key
  const models = await listProviderModels(providerId, apiKey);

  const id = randomUUID();

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id,
      providerId,
      connectionType: "apikey",
      connectedAt: new Date().toISOString(),
      isRevoked: false,
      connectionMeta: {
        apiKey,
      },
    })
    .send();

  return { connectionId: id, models };
}
