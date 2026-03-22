import { randomUUID } from "node:crypto";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { providers } from "./providers.js";

export async function submitOAuthConnection(
  resources: Resources,
  providerId: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresAt: string | undefined,
  scopes: string[],
  accountId: string | undefined,
  clientId: string | undefined,
): Promise<string> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);
  if (def.connectionType !== "oauth") {
    throw new Error(
      `Provider "${providerId}" does not support OAuth connections`,
    );
  }

  const id = randomUUID();

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id,
      providerId,
      connectionType: "oauth",
      connectedAt: new Date().toISOString(),
      isRevoked: false,
      connectionMeta: {
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes.join(","),
        accountId: accountId ?? "unknown",
        clientId,
        tokenUrl: def.tokenUrl,
      },
    })
    .send();

  return id;
}
