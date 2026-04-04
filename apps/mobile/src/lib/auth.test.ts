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

import { clearToken, getCognitoRegion, isAuthEnabled, setToken } from "./auth";

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
