import type { OAuthAdapter, OAuthProviderConfig } from "./configs.js";
import { oauthConfigs } from "./configs.js";
import { getOAuthCredentials } from "./getOAuthCredentials.js";

const adapterCache = new Map<string, OAuthAdapter>();

function getRedirectUri(config: OAuthProviderConfig): string {
  return (
    process.env[config.redirectUriEnvVar] ||
    `http://localhost:3001/auth/${config.providerId}/callback`
  );
}

export async function getAdapter(providerId: string): Promise<OAuthAdapter> {
  const cached = adapterCache.get(providerId);
  if (cached) return cached;

  const config = oauthConfigs.get(providerId);
  if (!config) throw new Error(`No OAuth config for provider: ${providerId}`);

  const { clientId, clientSecret } = await getOAuthCredentials(config.secretId);
  const redirectUri = getRedirectUri(config);

  const adapter = config.createAdapter(clientId, clientSecret, redirectUri);
  adapterCache.set(providerId, adapter);
  return adapter;
}
