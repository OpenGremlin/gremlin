import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./logger", () => ({
  clientLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { clearToken, getToken, gql, setToken } from "./auth";

const TOKEN_KEY = "gremlin_admin_token";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gql", () => {
  const query = { toString: () => "query Test { test { id } }" };

  it("sends POST to /graphql with query and variables", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ data: { test: { id: "1" } } }),
    });

    await gql(query, { id: "1" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/graphql"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query Test { test { id } }",
          variables: { id: "1" },
        }),
      },
    );
  });

  it("returns data on success", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ data: { test: { id: "1" } } }),
    });

    const result = await gql(query);
    expect(result).toEqual({ test: { id: "1" } });
  });

  it("throws on GraphQL errors", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: () =>
        Promise.resolve({
          errors: [{ message: "Field not found" }],
        }),
    });

    await expect(gql(query)).rejects.toThrow("Field not found");
  });

  it("includes Authorization header when token exists", async () => {
    setToken("my-token");

    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ data: { test: true } }),
    });

    await gql(query);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/graphql"),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer my-token",
        },
      }),
    );
  });

  it("on 401, clears token and throws", async () => {
    setToken("expired-token");

    // Mock window.location.href setter to prevent jsdom navigation error
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: window.location.href,
      origin: window.location.origin,
    } as Location);

    fetchMock.mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(gql(query)).rejects.toThrow("Unauthorized");
    expect(getToken()).toBeNull();

    locationSpy.mockRestore();
  });
});
