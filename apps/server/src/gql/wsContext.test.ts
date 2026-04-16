import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { AuthUser } from "./auth.js";
import { createWsContext } from "./wsContext.js";

// These tests exercise createWsContext end-to-end, including the real buildContext →
// createLoaders path. That works because DataLoader is lazy (it stores the batch fn
// closure; it doesn't touch the resources until a load happens). If createLoaders
// grows eager validation, these tests will need real loader stubs.
describe("createWsContext", () => {
  let verifySpy: ReturnType<typeof vi.fn<(token: string) => Promise<AuthUser>>>;
  let resources: Resources;
  let services: Services;

  beforeEach(() => {
    verifySpy = vi.fn<(token: string) => Promise<AuthUser>>();
    resources = mockDeep<Resources>();
    services = mockDeep<Services>();
  });

  it("builds context from a valid token in connectionParams", async () => {
    const user: AuthUser = { sub: "user-1", email: "u@e.com" };
    verifySpy.mockResolvedValueOnce(user);
    const context = createWsContext({
      skipAuth: false,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
      verifyToken: verifySpy,
    });

    const result = await context({ connectionParams: { token: "good-token" } });

    expect(verifySpy).toHaveBeenCalledWith("good-token");
    expect(result.user).toEqual(user);
    expect(result.serverBaseUrl).toBe("http://server.test");
    expect(result.mediaBaseUrl).toBe("http://server.test/media");
  });

  it("throws Unauthorized when token is missing", async () => {
    const context = createWsContext({
      skipAuth: false,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
      verifyToken: verifySpy,
    });

    await expect(context({ connectionParams: {} })).rejects.toThrow(
      "Unauthorized",
    );
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when connectionParams is undefined", async () => {
    const context = createWsContext({
      skipAuth: false,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
      verifyToken: verifySpy,
    });

    await expect(context({})).rejects.toThrow("Unauthorized");
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("propagates errors from verifyToken", async () => {
    verifySpy.mockRejectedValueOnce(new Error("token expired"));
    const context = createWsContext({
      skipAuth: false,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
      verifyToken: verifySpy,
    });

    await expect(
      context({ connectionParams: { token: "bad" } }),
    ).rejects.toThrow("token expired");
  });

  it("bypasses verifyToken and uses a local user when skipAuth is true", async () => {
    const context = createWsContext({
      skipAuth: true,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
      verifyToken: verifySpy,
    });

    const result = await context({ connectionParams: {} });

    expect(verifySpy).not.toHaveBeenCalled();
    expect(result.user).toEqual({ sub: "local", email: "local@dev" });
  });
});
