import type { Logger } from "@opengremlin/lib/logger.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { AuthUser } from "./auth.js";
import { createAuthPlugin } from "./authPlugin.js";

function makeHarness(opts: {
  skipAuth?: boolean;
  verifyToken?: (token: string) => Promise<AuthUser>;
}) {
  const userByRequest = new WeakMap<Request, AuthUser>();
  const plugin = createAuthPlugin({
    skipAuth: opts.skipAuth ?? false,
    userByRequest,
    verifyToken: opts.verifyToken,
    log: mockDeep<Logger>(),
  });

  // fetchAPI in production is yoga's full fetch polyfill (Request, Response, Headers, fetch, FormData…).
  // The plugin only uses Response.json, so a minimal stub suffices. If the plugin starts touching
  // fetchAPI.Headers or fetchAPI.fetch, this harness must grow to avoid silent undefineds in tests.
  async function run(request: Request): Promise<Response | null> {
    let captured: Response | null = null;
    const endResponse = vi.fn((res: Response) => {
      captured = res;
    });
    await (plugin.onRequest as any)({
      request,
      fetchAPI: { Response },
      endResponse,
    });
    return captured;
  }

  return { userByRequest, run };
}

function makeRequest(opts: {
  method?: string;
  authorization?: string;
}): Request {
  const headers = new Headers();
  if (opts.authorization) headers.set("authorization", opts.authorization);
  return new Request("http://localhost/graphql", {
    method: opts.method ?? "POST",
    headers,
  });
}

describe("createAuthPlugin", () => {
  let verifySpy: ReturnType<typeof vi.fn<(token: string) => Promise<AuthUser>>>;

  beforeEach(() => {
    verifySpy = vi.fn<(token: string) => Promise<AuthUser>>();
  });

  it("attaches the authenticated user to the WeakMap on a valid Bearer token", async () => {
    const user: AuthUser = { sub: "user-1", email: "u@e.com" };
    verifySpy.mockResolvedValueOnce(user);
    const { userByRequest, run } = makeHarness({ verifyToken: verifySpy });

    const request = makeRequest({ authorization: "Bearer good-token" });
    const captured = await run(request);

    expect(captured).toBeNull();
    expect(verifySpy).toHaveBeenCalledWith("good-token");
    expect(userByRequest.get(request)).toEqual(user);
  });

  it("responds 401 when Authorization header is missing", async () => {
    const { userByRequest, run } = makeHarness({ verifyToken: verifySpy });

    const request = makeRequest({});
    const captured = await run(request);

    expect(captured?.status).toBe(401);
    expect(await captured?.json()).toEqual({
      errors: [{ message: "Unauthorized" }],
    });
    expect(verifySpy).not.toHaveBeenCalled();
    expect(userByRequest.get(request)).toBeUndefined();
  });

  it("responds 401 when Authorization header does not start with 'Bearer '", async () => {
    const { run } = makeHarness({ verifyToken: verifySpy });

    const captured = await run(
      makeRequest({ authorization: "Basic dXNlcjpwYXNz" }),
    );

    expect(captured?.status).toBe(401);
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("responds 401 when verifyToken throws", async () => {
    verifySpy.mockRejectedValueOnce(new Error("bad token"));
    const { userByRequest, run } = makeHarness({ verifyToken: verifySpy });

    const request = makeRequest({ authorization: "Bearer bad-token" });
    const captured = await run(request);

    expect(captured?.status).toBe(401);
    expect(userByRequest.get(request)).toBeUndefined();
  });

  it("skips auth entirely when skipAuth is true", async () => {
    const { userByRequest, run } = makeHarness({
      skipAuth: true,
      verifyToken: verifySpy,
    });

    const request = makeRequest({});
    const captured = await run(request);

    expect(captured).toBeNull();
    expect(verifySpy).not.toHaveBeenCalled();
    expect(userByRequest.get(request)).toBeUndefined();
  });

  it("skips auth on OPTIONS preflight requests", async () => {
    const { run } = makeHarness({ verifyToken: verifySpy });

    const captured = await run(makeRequest({ method: "OPTIONS" }));

    expect(captured).toBeNull();
    expect(verifySpy).not.toHaveBeenCalled();
  });
});
