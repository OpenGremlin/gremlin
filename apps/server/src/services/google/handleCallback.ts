import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

export async function handleGoogleCallback(
  resources: Resources,
  code: string,
  userId: string,
): Promise<void> {
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
  const scopes = (tokens.scope ?? "").split(" ").join(",");

  // Store OAuth tokens
  await resources.ddb.entities.GoogleOAuthToken.build(PutItemCommand)
    .item({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scopes,
      email,
      connectedAt: now,
    })
    .send();

  // Upsert Integration record
  await resources.ddb.entities.Integration.build(PutItemCommand)
    .item({
      id: "google",
      service: "Google",
      icon: "🔗",
      description: "Gmail (read/send) and Google Docs (read)",
      account: email,
      connectedAt: now,
      authMethod: "OAUTH",
      permissions: [
        { scope: "gmail.readonly", label: "Read Gmail", enabled: true },
        { scope: "gmail.send", label: "Send Gmail", enabled: true },
        { scope: "documents.readonly", label: "Read Google Docs", enabled: true },
      ],
    })
    .send();
}
