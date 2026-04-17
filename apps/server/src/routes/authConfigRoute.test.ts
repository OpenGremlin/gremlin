import type { Resources } from "@opengremlin/lib/resources/index.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { createAuthConfigRoute } from "./authConfigRoute.js";

function mockRes() {
  return {
    setHeader: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("authConfigRoute", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns skipAuth:true when COGNITO_DOMAIN is not set", async () => {
    delete process.env.COGNITO_DOMAIN;
    delete process.env.COGNITO_CLIENT_ID;
    const resources = mockDeep<Resources>();
    const handler = createAuthConfigRoute(resources);
    const res = mockRes();

    await handler({} as any, res as any);

    expect(res.json).toHaveBeenCalledWith({ skipAuth: true });
  });

  it("returns cognitoDomain + clientId when env vars are set", async () => {
    process.env.COGNITO_DOMAIN = "auth.example.com";
    process.env.COGNITO_CLIENT_ID = "client-123";
    const resources = mockDeep<Resources>();
    // GlobalSettings.build(...).key(...).send() → { Item: null }
    (resources.ddb.entities.GlobalSettings as any).build = vi
      .fn()
      .mockReturnValue({
        key: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Item: null }),
        }),
      });
    const handler = createAuthConfigRoute(resources);
    const res = mockRes();

    await handler({} as any, res as any);

    expect(res.json).toHaveBeenCalledWith({
      cognitoDomain: "auth.example.com",
      clientId: "client-123",
      signupDisabled: false,
    });
  });

  it("returns signupDisabled:true when GlobalSettings has it set", async () => {
    process.env.COGNITO_DOMAIN = "auth.example.com";
    process.env.COGNITO_CLIENT_ID = "client-123";
    const resources = mockDeep<Resources>();
    (resources.ddb.entities.GlobalSettings as any).build = vi
      .fn()
      .mockReturnValue({
        key: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Item: { signupDisabled: true } }),
        }),
      });
    const handler = createAuthConfigRoute(resources);
    const res = mockRes();

    await handler({} as any, res as any);

    expect(res.json).toHaveBeenCalledWith({
      cognitoDomain: "auth.example.com",
      clientId: "client-123",
      signupDisabled: true,
    });
  });
});
