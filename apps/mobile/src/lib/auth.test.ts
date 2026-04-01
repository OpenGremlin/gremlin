import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing auth
vi.mock("./config", () => ({
  config: {
    cognitoDomain: "https://myapp.auth.us-west-2.amazoncognito.com",
    cognitoClientId: "test-client-id",
    skipAuth: false,
    apiUrl: "http://localhost:3001",
  },
  getApiUrl: () => "http://localhost:3001",
}));

vi.mock("./storage", () => ({
  storage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    deleteItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("./logger", () => ({
  clientLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { parse } from "graphql";
import {
  clearToken,
  getCognitoRegion,
  gql,
  isAuthEnabled,
  setOnTokenChange,
  setToken,
} from "./auth";

describe("getCognitoRegion", () => {
  it("extracts region from cognito domain", () => {
    expect(getCognitoRegion()).toBe("us-west-2");
  });
});

describe("isAuthEnabled", () => {
  it("returns true when cognitoDomain is set", () => {
    expect(isAuthEnabled()).toBe(true);
  });
});

describe("gql", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const fakeQuery = parse("query { test }") as Parameters<typeof gql>[0];

  it("returns data on success", async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ data: { test: "value" } }),
    });
    const result = await gql(fakeQuery);
    expect(result).toEqual({ test: "value" });
  });

  it("includes auth header when token is set", async () => {
    await setToken("my-token");
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ data: { ok: true } }),
    });
    await gql(fakeQuery);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer my-token");
    await clearToken();
  });

  it("throws on GraphQL errors", async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ errors: [{ message: "Something broke" }] }),
    });
    await expect(gql(fakeQuery)).rejects.toThrow("Something broke");
  });

  it("clears token and throws on 401", async () => {
    await setToken("expired-token");
    mockFetch.mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({}),
    });
    await expect(gql(fakeQuery)).rejects.toThrow("Unauthorized");
  });
});

/** Build a fake JWT with a given exp timestamp. */
function fakeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "none" }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.sig`;
}

describe("proactive token refresh", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await clearToken();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules refresh 5 minutes before token expiry", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt(now + 3600); // expires in 1 hour

    await setToken(token);

    // Timer should be set for ~55 minutes from now
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not schedule refresh for already-expired tokens", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt(now - 60); // expired 1 minute ago

    await setToken(token);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not schedule refresh for tokens expiring within 5 minutes", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt(now + 120); // expires in 2 minutes

    await setToken(token);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears timer on clearToken", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt(now + 3600);

    await setToken(token);
    expect(vi.getTimerCount()).toBe(1);

    await clearToken();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replaces timer when setToken is called again", async () => {
    const now = Math.floor(Date.now() / 1000);

    await setToken(fakeJwt(now + 3600));
    expect(vi.getTimerCount()).toBe(1);

    await setToken(fakeJwt(now + 7200));
    expect(vi.getTimerCount()).toBe(1); // replaced, not added
  });
});

describe("onTokenChange callback", () => {
  const mockFetch = vi.fn();

  beforeEach(async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    await clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires onTokenChange when token is refreshed via 401 retry", async () => {
    const onChange = vi.fn();
    setOnTokenChange(onChange);

    // Set initial token + refresh token
    await setToken("old-id-token");
    const { storage } = await import("./storage");
    (storage.getItem as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string) => {
        if (key === "gremlin_refresh_token") return "refresh-tok";
        if (key === "gremlin_admin_token") return "old-id-token";
        return null;
      },
    );

    // First call returns 401, refresh succeeds, retry succeeds
    mockFetch
      .mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        // Cognito refresh response
        ok: true,
        json: () =>
          Promise.resolve({
            AuthenticationResult: {
              IdToken: "new-id-token",
              AccessToken: "new-access-token",
            },
          }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ data: { ok: true } }),
      });

    const fakeQuery2 = parse("query { test }") as Parameters<typeof gql>[0];
    await gql(fakeQuery2);

    expect(onChange).toHaveBeenCalledWith("new-id-token");
    setOnTokenChange(() => {});
  });
});
