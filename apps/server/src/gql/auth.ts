import * as jose from "jose";

export interface AuthUser {
  sub: string;
  email: string;
}

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
  return { issuer: cachedIssuer, clientId: cachedClientId!, jwks: jwks! };
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { issuer, clientId, jwks } = getConfig();
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer,
    audience: clientId,
  });
  const email =
    (payload.email as string | undefined)?.toLowerCase() ?? "";
  return { sub: payload.sub as string, email };
}
