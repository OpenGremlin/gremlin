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

import {
  clearToken,
  getCognitoRegion,
  gql,
  isAuthEnabled,
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

  const fakeQuery = {
    toString: () => "query { test }",
  } as Parameters<typeof gql>[0];

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
      json: () =>
        Promise.resolve({ errors: [{ message: "Something broke" }] }),
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
