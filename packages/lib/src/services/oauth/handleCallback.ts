import { decodeIdToken } from "arctic";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { describeScopes } from "../integrations/describeScopes.js";
import {
  oauthConfigs,
  type TokenResult,
  type UserInfoConfig,
} from "./configs.js";
import { getAdapter } from "./getAdapter.js";

interface OAuthState {
  userId: string;
  connectionId: string;
  scopes: string[];
  providerId: string;
  codeVerifier?: string;
}

function getNestedValue(obj: unknown, path: string): unknown {
  let current = obj;
  for (const part of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

async function resolveAccountId(
  userInfo: UserInfoConfig,
  tokens: TokenResult,
): Promise<string> {
  switch (userInfo.method) {
    case "id_token": {
      if (!tokens.idToken) return "unknown";
      const claims = decodeIdToken(tokens.idToken) as { email?: string };
      return claims.email ?? "unknown";
    }
    case "rest": {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${tokens.accessToken}`,
        ...(userInfo.headers ?? {}),
      };
      const res = await fetch(userInfo.url, { headers });
      if (!res.ok) return "unknown";
      const data = await res.json();
      return String(getNestedValue(data, userInfo.path) ?? "unknown");
    }
    case "graphql": {
      const res = await fetch(userInfo.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userInfo.query }),
      });
      if (!res.ok) return "unknown";
      const data = await res.json();
      return String(getNestedValue(data, userInfo.path) ?? "unknown");
    }
  }
}

export async function handleOAuthCallback(
  resources: Resources,
  code: string,
  stateRaw: string,
): Promise<{ connectionId: string }> {
  const state: OAuthState = JSON.parse(stateRaw);
  const { connectionId, scopes, providerId, codeVerifier } = state;

  const config = oauthConfigs.get(providerId);
  if (!config) throw new Error(`No OAuth config for provider: ${providerId}`);

  const adapter = await getAdapter(providerId);
  const tokens = await adapter.validateAuthorizationCode(
    code,
    codeVerifier ?? null,
  );

  const accountId = await resolveAccountId(config.userInfo, tokens);
  const now = new Date().toISOString();
  const expiresAt = tokens.accessTokenExpiresAt?.toISOString();
  const description = describeScopes(providerId, scopes);

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id: connectionId,
      providerId,
      connectionType: "oauth",
      description,
      connectedAt: now,
      isRevoked: false,
      connectionMeta: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        scopes: scopes.join(","),
        accountId,
      },
    })
    .send();

  return { connectionId };
}
