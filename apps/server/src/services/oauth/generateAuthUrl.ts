import crypto from "node:crypto";
import { generateCodeVerifier } from "arctic";
import type { ServiceContext } from "../context.js";
import { oauthConfigs } from "./configs.js";
import { getAdapter } from "./getAdapter.js";

export async function generateAuthUrl(
  ctx: ServiceContext,
  providerId: string,
  scopes: string[],
): Promise<string> {
  const config = oauthConfigs.get(providerId);
  if (!config) throw new Error(`No OAuth config for provider: ${providerId}`);

  const adapter = await getAdapter(providerId);

  const connectionId = crypto.randomUUID();
  const codeVerifier = config.pkce ? generateCodeVerifier() : null;

  // Build expanded scopes: defaults first, then user scopes with optional prefix
  const allScopes = [...(config.defaultScopes ?? [])];
  for (const s of scopes) {
    const expanded =
      config.scopePrefix && !s.startsWith("https://")
        ? `${config.scopePrefix}${s}`
        : s;
    if (!allScopes.includes(expanded)) allScopes.push(expanded);
  }

  const state = JSON.stringify({
    userId: ctx.user?.sub,
    connectionId,
    scopes,
    providerId,
    ...(codeVerifier ? { codeVerifier } : {}),
  });

  const url = adapter.createAuthorizationURL(state, codeVerifier, allScopes);

  // Append extra auth params
  if (config.extraAuthParams) {
    for (const [key, value] of Object.entries(config.extraAuthParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}
