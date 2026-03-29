import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────

const mockSsmSend = vi.fn();
vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: class {
    send = mockSsmSend;
  },
  GetParameterCommand: class {
    constructor(public input: { Name: string }) {}
  },
}));

const mockJwtVerify = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: () => "mock-jwks",
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

// ── Helpers ────────────────────────────────────────────────

function makeEvent(authHeader?: string): CloudFrontRequestEvent {
  const headers: Record<string, Array<{ key: string; value: string }>> = {};
  if (authHeader) {
    headers.authorization = [{ key: "Authorization", value: authHeader }];
  }
  return {
    Records: [
      {
        cf: {
          config: {
            distributionDomainName: "d111111abcdef8.cloudfront.net",
            distributionId: "EDFDVBD6EXAMPLE",
            eventType: "viewer-request",
            requestId: "test-request-id",
          },
          request: {
            clientIp: "1.2.3.4",
            headers,
            method: "GET",
            querystring: "",
            uri: "/api/files/test.png",
          },
        },
      },
    ],
  };
}

function setupSsm() {
  mockSsmSend.mockImplementation((cmd: { input: { Name: string } }) => {
    if (cmd.input.Name === "/gremlin/cognito-issuer") {
      return {
        Parameter: {
          Value: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc",
        },
      };
    }
    if (cmd.input.Name === "/gremlin/cognito-client-id") {
      return { Parameter: { Value: "test-client-id" } };
    }
    throw new Error(`Unknown param: ${cmd.input.Name}`);
  });
}

// ── Tests ──────────────────────────────────────────────────

describe("files-auth Lambda@Edge", () => {
  let handler: (
    event: CloudFrontRequestEvent,
  ) => Promise<CloudFrontRequestResult>;

  beforeEach(async () => {
    vi.resetModules();
    mockSsmSend.mockReset();
    mockJwtVerify.mockReset();
    setupSsm();

    const mod = await import("./index.js");
    handler = mod.handler;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const result = await handler(makeEvent());
    expect(result).toMatchObject({ status: "401" });
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const result = await handler(makeEvent("Basic abc123"));
    expect(result).toMatchObject({ status: "401" });
  });

  it("returns 401 when JWT verification fails", async () => {
    mockJwtVerify.mockRejectedValue(new Error("invalid signature"));

    const result = await handler(makeEvent("Bearer bad-token"));
    expect(result).toMatchObject({ status: "401" });
  });

  it("returns 403 when user is not in admins group", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { "cognito:groups": ["users"], sub: "user-1" },
    });

    const result = await handler(makeEvent("Bearer valid-token"));
    expect(result).toMatchObject({ status: "403" });
  });

  it("returns 403 when cognito:groups is absent", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "user-1" },
    });

    const result = await handler(makeEvent("Bearer valid-token"));
    expect(result).toMatchObject({ status: "403" });
  });

  it("passes request through and strips Authorization for valid admin", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { "cognito:groups": ["admins"], sub: "admin-1" },
    });

    const result = await handler(makeEvent("Bearer valid-token"));

    // Should return the request object (not a deny response)
    expect(result).toHaveProperty("uri", "/api/files/test.png");
    expect(result).not.toHaveProperty("status");
    // Authorization header should be stripped
    expect(
      (result as { headers: Record<string, unknown> }).headers.authorization,
    ).toBeUndefined();
  });

  it("verifies JWT with correct issuer and audience", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { "cognito:groups": ["admins"], sub: "admin-1" },
    });

    await handler(makeEvent("Bearer my-token"));

    expect(mockJwtVerify).toHaveBeenCalledWith("my-token", "mock-jwks", {
      issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc",
      audience: "test-client-id",
    });
  });

  it("returns 503 when SSM is unavailable", async () => {
    vi.resetModules();
    mockSsmSend.mockRejectedValue(new Error("SSM unavailable"));

    const mod = await import("./index.js");
    const result = await mod.handler(makeEvent("Bearer valid-token"));
    expect(result).toMatchObject({ status: "503" });
  });

  it("caches SSM config after first call", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { "cognito:groups": ["admins"], sub: "admin-1" },
    });

    await handler(makeEvent("Bearer token-1"));
    await handler(makeEvent("Bearer token-2"));

    // SSM should be called only on the first invocation (2 params)
    expect(mockSsmSend).toHaveBeenCalledTimes(2);
  });
});
