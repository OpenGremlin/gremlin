import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { describeScopes } from "../integrations/describeScopes.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

interface OAuthState {
  userId: string;
  connectionId: string;
  scopes: string[];
}

export async function handleGoogleCallback(
  resources: Resources,
  code: string,
  stateRaw: string,
): Promise<void> {
  const state: OAuthState = JSON.parse(stateRaw);
  const { userId, connectionId, scopes } = state;

  const client = await getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing tokens from Google OAuth response");
  }

  // Decode the id_token to get the user's email
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: client._clientId,
  });
  const email = ticket.getPayload()?.email ?? "unknown";

  const now = new Date().toISOString();
  const expiresAt = new Date(tokens.expiry_date ?? 0).toISOString();
  const description = describeScopes("google", scopes);

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id: connectionId,
      providerId: "google",
      connectionType: "oauth",
      description,
      connectedAt: now,
      isRevoked: false,
      connectionMeta: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: scopes.join(","),
        accountId: email,
      },
    })
    .send();
}
