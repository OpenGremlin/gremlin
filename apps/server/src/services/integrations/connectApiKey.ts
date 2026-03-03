import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { randomUUID } from "node:crypto";
import type { Resources } from "../../resources/index.js";
import { providers } from "./providers.js";

export async function connectApiKey(
  resources: Resources,
  providerId: string,
  apiKey: string,
): Promise<string> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);
  if (def.connectionType !== "apikey") {
    throw new Error(`Provider "${providerId}" does not support API key connections`);
  }

  const id = randomUUID();

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id,
      providerId,
      connectionType: "apikey",
      description: def.service,
      connectedAt: new Date().toISOString(),
      isRevoked: false,
      connectionMeta: {
        apiKey,
      },
    })
    .send();

  return id;
}
