import type { Logger } from "@opengremlin/lib/logger.js";
import * as jose from "jose";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { AuthUser } from "./auth.js";

// Proves the real verifyToken and the real createAuthPlugin compose correctly:
// a crafted token that jose actually validates flows through the plugin without the
// verifyToken injection hook. Catches contract drift (e.g., jose error types the
// plugin's try/catch assumes).

process.env.AWS_REGION = "us-east-1";
process.env.COGNITO_USER_POOL_ID = "us-east-1_test";
process.env.COGNITO_CLIENT_ID = "test-client-id";

const ISSUER = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test";
const CLIENT_ID = "test-client-id";
const KID = "integration-kid";

const { publicJwkRef } = vi.hoisted(() => ({
  publicJwkRef: { current: undefined as jose.JWK | undefined },
}));

vi.mock("jose", async () => {
  const actual = await vi.importActual<typeof import("jose")>("jose");
  return {
    ...actual,
    createRemoteJWKSet: () => {
      return async (
        header: jose.JWSHeaderParameters,
        input: jose.FlattenedJWSInput,
      ) => {
        if (!publicJwkRef.current) {
          throw new Error("Test JWKS not initialized");
        }
        const local = actual.createLocalJWKSet({
          keys: [publicJwkRef.current],
        });
        return local(header, input);
      };
    },
  };
});

const { __resetAuthConfigForTests } = await import("./auth.js");
const { createAuthPlugin } = await import("./authPlugin.js");

let privateKey: jose.CryptoKey;

beforeAll(async () => {
  const keyPair = await jose.generateKeyPair("RS256", { extractable: true });
  privateKey = keyPair.privateKey;
  const jwk = await jose.exportJWK(keyPair.publicKey);
  publicJwkRef.current = { ...jwk, kid: KID, alg: "RS256", use: "sig" };
});

beforeEach(() => {
  // Guard against JWKS cached from other tests in the same worker.
  __resetAuthConfigForTests();
});

async function sign(opts: { groups?: string[]; expiresInSeconds?: number }) {
  const payload: Record<string, unknown> = {
    sub: "integration-user",
    email: "u@e.com",
  };
  if (opts.groups !== undefined) payload["cognito:groups"] = opts.groups;
  const exp = Math.floor(Date.now() / 1000) + (opts.expiresInSeconds ?? 3600);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(CLIENT_ID)
    .setExpirationTime(exp)
    .sign(privateKey);
}

async function runPlugin(request: Request): Promise<{
  captured: Response | null;
  userByRequest: WeakMap<Request, AuthUser>;
}> {
  const userByRequest = new WeakMap<Request, AuthUser>();
  const plugin = createAuthPlugin({
    skipAuth: false,
    userByRequest,
    log: mockDeep<Logger>(),
    // NOTE: verifyToken NOT injected — we want the real one.
  });
  let captured: Response | null = null;
  const endResponse = vi.fn((res: Response) => {
    captured = res;
  });
  await (plugin.onRequest as any)({
    request,
    fetchAPI: { Response },
    endResponse,
  });
  return { captured, userByRequest };
}

function makeRequest(authorization: string) {
  return new Request("http://localhost/graphql", {
    method: "POST",
    headers: { authorization },
  });
}

describe("authPlugin + verifyToken integration", () => {
  it("attaches the user when a real admin token verifies successfully", async () => {
    const token = await sign({ groups: ["admins"] });
    const request = makeRequest(`Bearer ${token}`);

    const { captured, userByRequest } = await runPlugin(request);

    expect(captured).toBeNull();
    expect(userByRequest.get(request)).toEqual({
      sub: "integration-user",
      email: "u@e.com",
    });
  });

  it("returns 401 when a real expired token is rejected by jose", async () => {
    const token = await sign({ groups: ["admins"], expiresInSeconds: -60 });
    const request = makeRequest(`Bearer ${token}`);

    const { captured, userByRequest } = await runPlugin(request);

    expect(captured?.status).toBe(401);
    expect(userByRequest.get(request)).toBeUndefined();
  });

  it("returns 401 when a real token lacks the admins group", async () => {
    const token = await sign({ groups: ["users"] });
    const request = makeRequest(`Bearer ${token}`);

    const { captured, userByRequest } = await runPlugin(request);

    expect(captured?.status).toBe(401);
    expect(userByRequest.get(request)).toBeUndefined();
  });
});
