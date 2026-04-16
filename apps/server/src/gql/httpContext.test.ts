import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { buildTestContext } from "../__testing__/buildTestContext.js";
import type { AuthUser } from "./auth.js";
import { createHttpContext } from "./httpContext.js";

describe("createHttpContext", () => {
  let userByRequest: WeakMap<Request, AuthUser>;
  let resources: Resources;
  let services: Services;

  beforeEach(() => {
    userByRequest = new WeakMap<Request, AuthUser>();
    resources = mockDeep<Resources>();
    services = mockDeep<Services>();
  });

  it("builds context from the user attached to the request by the auth plugin", async () => {
    const user: AuthUser = { sub: "user-1", email: "u@e.com" };
    const request = new Request("http://localhost/graphql", { method: "POST" });
    userByRequest.set(request, user);

    const context = createHttpContext({
      skipAuth: false,
      userByRequest,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
    });
    const result = await context({ request });

    expect(result.user).toEqual(user);
    expect(result.serverBaseUrl).toBe("http://server.test");
    expect(result.mediaBaseUrl).toBe("http://server.test/media");
  });

  it("throws Unauthorized when no user is attached (plugin-ordering bug guard)", async () => {
    const request = new Request("http://localhost/graphql", { method: "POST" });

    const context = createHttpContext({
      skipAuth: false,
      userByRequest,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
    });

    await expect(context({ request })).rejects.toThrow("Unauthorized");
  });

  it("uses a local user and bypasses the WeakMap lookup when skipAuth is true", async () => {
    const request = new Request("http://localhost/graphql", { method: "POST" });

    const context = createHttpContext({
      skipAuth: true,
      userByRequest,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
    });
    const result = await context({ request });

    expect(result.user).toEqual({ sub: "local", email: "local@dev" });
  });

  it("builds a GremlinContext shape assignable to downstream resolvers", async () => {
    // Sanity check that the result is interoperable with the same helper resolver tests will use.
    const user: AuthUser = { sub: "user-1", email: "u@e.com" };
    const request = new Request("http://localhost/graphql", { method: "POST" });
    userByRequest.set(request, user);

    const context = createHttpContext({
      skipAuth: false,
      userByRequest,
      getServerBaseUrl: async () => "http://server.test",
      resources,
      services,
    });
    const result = await context({ request });
    const reference = buildTestContext({ user });

    expect(Object.keys(result).sort()).toEqual(Object.keys(reference).sort());
  });
});
