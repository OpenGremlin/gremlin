import * as jose from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.AWS_REGION = "us-east-1";
process.env.COGNITO_USER_POOL_ID = "us-east-1_test";
process.env.COGNITO_CLIENT_ID = "test-client-id";

const ISSUER = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test";
const CLIENT_ID = "test-client-id";
const KID = "test-kid";

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

const { verifyToken } = await import("./auth.js");

let privateKey: jose.CryptoKey;

beforeAll(async () => {
  const keyPair = await jose.generateKeyPair("RS256", { extractable: true });
  privateKey = keyPair.privateKey;
  const jwk = await jose.exportJWK(keyPair.publicKey);
  publicJwkRef.current = { ...jwk, kid: KID, alg: "RS256", use: "sig" };
});

interface SignOpts {
  sub?: string;
  email?: string;
  groups?: string[] | undefined;
  issuer?: string;
  audience?: string;
  expiresAtEpochSeconds?: number;
}

async function signToken(opts: SignOpts = {}) {
  const payload: Record<string, unknown> = {};
  if (opts.sub !== undefined) payload.sub = opts.sub;
  if (opts.email !== undefined) payload.email = opts.email;
  if (opts.groups !== undefined) payload["cognito:groups"] = opts.groups;

  const exp =
    opts.expiresAtEpochSeconds ?? Math.floor(Date.now() / 1000) + 3600;

  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuedAt()
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? CLIENT_ID)
    .setExpirationTime(exp)
    .sign(privateKey);
}

describe("verifyToken", () => {
  it("returns AuthUser for a valid admin token with lowercased email", async () => {
    const token = await signToken({
      sub: "user-123",
      email: "User@Example.COM",
      groups: ["admins"],
    });
    const user = await verifyToken(token);
    expect(user).toEqual({ sub: "user-123", email: "user@example.com" });
  });

  it("rejects tokens whose groups claim does not include admins", async () => {
    const token = await signToken({
      sub: "user-123",
      email: "u@e.com",
      groups: ["users"],
    });
    await expect(verifyToken(token)).rejects.toThrow("not authorized");
  });

  it("rejects tokens with no cognito:groups claim at all", async () => {
    const token = await signToken({ sub: "user-123", email: "u@e.com" });
    await expect(verifyToken(token)).rejects.toThrow("not authorized");
  });

  it("rejects expired tokens", async () => {
    const token = await signToken({
      sub: "user-123",
      email: "u@e.com",
      groups: ["admins"],
      expiresAtEpochSeconds: Math.floor(Date.now() / 1000) - 60,
    });
    await expect(verifyToken(token)).rejects.toBeInstanceOf(
      jose.errors.JWTExpired,
    );
  });

  it("rejects tokens with the wrong issuer", async () => {
    const token = await signToken({
      sub: "user-123",
      email: "u@e.com",
      groups: ["admins"],
      issuer: "https://evil.example.com",
    });
    await expect(verifyToken(token)).rejects.toMatchObject({
      code: "ERR_JWT_CLAIM_VALIDATION_FAILED",
      claim: "iss",
    });
  });

  it("rejects tokens with the wrong audience", async () => {
    const token = await signToken({
      sub: "user-123",
      email: "u@e.com",
      groups: ["admins"],
      audience: "wrong-client-id",
    });
    await expect(verifyToken(token)).rejects.toMatchObject({
      code: "ERR_JWT_CLAIM_VALIDATION_FAILED",
      claim: "aud",
    });
  });

  it("rejects malformed JWT strings", async () => {
    await expect(verifyToken("not.a.jwt")).rejects.toBeInstanceOf(
      jose.errors.JWSInvalid,
    );
  });
});
