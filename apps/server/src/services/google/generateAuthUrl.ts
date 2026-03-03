import crypto from "node:crypto";
import type { ServiceContext } from "../context.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

const SCOPE_PREFIX = "https://www.googleapis.com/auth/";

/** Map short scope IDs to full Google OAuth scope URLs */
function expandScopes(scopes: string[]): string[] {
  return [
    "openid",
    "email",
    ...scopes.map((s) => (s.startsWith("https://") ? s : `${SCOPE_PREFIX}${s}`)),
  ];
}

export async function generateGoogleAuthUrl(
  ctx: ServiceContext,
  scopes: string[],
): Promise<string> {
  const client = await getGoogleOAuthClient();

  const connectionId = crypto.randomUUID();
  const state = JSON.stringify({
    userId: ctx.user?.sub,
    connectionId,
    scopes,
  });

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: expandScopes(scopes),
    state,
  });

  return url;
}
