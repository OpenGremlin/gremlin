import type { AuthUser } from "@opengremlin/lib/services/context.js";
import * as jose from "jose";
export type { AuthUser };

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
let cachedIssuer: string | null = null;
let cachedClientId: string | null = null;

function getConfig() {
  if (!cachedIssuer) {
    const region = process.env.AWS_REGION ?? "us-east-1";
    const userPoolId = process.env.COGNITO_USER_POOL_ID ?? "";
    cachedClientId = process.env.COGNITO_CLIENT_ID ?? "";
    cachedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    jwks = jose.createRemoteJWKSet(
      new URL(`${cachedIssuer}/.well-known/jwks.json`),
    );
  }
  // cachedClientId and jwks are guaranteed set after the if-block above
  return {
    issuer: cachedIssuer,
    clientId: cachedClientId as string,
    jwks: jwks as ReturnType<typeof jose.createRemoteJWKSet>,
  };
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { issuer, clientId, jwks } = getConfig();
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer,
    audience: clientId,
  });

  const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
  if (!groups.includes("admins")) {
    throw new Error("User is not authorized");
  }

  const email = (payload.email as string | undefined)?.toLowerCase() ?? "";
  return { sub: payload.sub as string, email };
}

export function __resetAuthConfigForTests() {
  jwks = null;
  cachedIssuer = null;
  cachedClientId = null;
}
