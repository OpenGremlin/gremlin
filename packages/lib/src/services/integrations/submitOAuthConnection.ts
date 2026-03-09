import { randomUUID } from "node:crypto";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { oauthConfigs } from "../oauth/configs.js";
import { describeScopes } from "./describeScopes.js";
import { providers } from "./providers.js";

export async function submitOAuthConnection(
  resources: Resources,
  providerId: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresAt: string | undefined,
  scopes: string[],
  accountId: string | undefined,
): Promise<string> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);
  if (def.connectionType !== "oauth") {
    throw new Error(
      `Provider "${providerId}" does not support OAuth connections`,
    );
  }

  const config = oauthConfigs.get(providerId);
  if (!config) throw new Error(`No OAuth config for provider: ${providerId}`);

  const id = randomUUID();
  const description = describeScopes(providerId, scopes);

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id,
      providerId,
      connectionType: "oauth",
      description,
      connectedAt: new Date().toISOString(),
      isRevoked: false,
      connectionMeta: {
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes.join(","),
        accountId: accountId ?? "unknown",
      },
    })
    .send();

  return id;
}
