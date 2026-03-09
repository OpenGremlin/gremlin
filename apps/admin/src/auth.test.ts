import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./logger", () => ({
  clientLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  clearToken,
  cognitoConfirmSignup,
  cognitoLogin,
  cognitoSignup,
  getToken,
  gql,
  setToken,
} from "./auth";

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

    // Mock reload to prevent jsdom error
    const reloadMock = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      reload: reloadMock,
    } as unknown as Location);

    fetchMock.mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(gql(query)).rejects.toThrow("Unauthorized");
    expect(getToken()).toBeNull();
  });
});

describe("token management", () => {
  it("setToken stores and getToken retrieves", () => {
    expect(getToken()).toBeNull();
    setToken("abc");
    expect(getToken()).toBe("abc");
  });

  it("clearToken removes the token", () => {
    setToken("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("cognitoLogin", () => {
  it("calls Cognito InitiateAuth and returns idToken", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          AuthenticationResult: { IdToken: "id-token-123" },
        }),
    });

    const result = await cognitoLogin("user@example.com", "password123");
    expect(result.idToken).toBe("id-token-123");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("cognito-idp"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("USER_PASSWORD_AUTH"),
      }),
    );
  });

  it("throws on Cognito error", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          __type: "NotAuthorizedException",
          message: "Incorrect username or password.",
        }),
    });

    await expect(cognitoLogin("user@example.com", "wrong")).rejects.toThrow(
      "Incorrect username or password.",
    );
  });
});

describe("cognitoSignup", () => {
  it("calls Cognito SignUp and returns confirmation status", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ UserConfirmed: false }),
    });

    const result = await cognitoSignup("new@example.com", "password123");
    expect(result.userConfirmed).toBe(false);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("cognito-idp"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
        }),
      }),
    );
  });

  it("throws on duplicate email", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          __type: "UsernameExistsException",
          message: "An account with the given email already exists.",
        }),
    });

    await expect(
      cognitoSignup("existing@example.com", "password123"),
    ).rejects.toThrow("An account with the given email already exists.");
  });
});

describe("cognitoConfirmSignup", () => {
  it("calls Cognito ConfirmSignUp", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({}),
    });

    await cognitoConfirmSignup("user@example.com", "123456");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("cognito-idp"),
      expect.objectContaining({
        body: expect.stringContaining("123456"),
      }),
    );
  });

  it("throws on invalid code", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          __type: "CodeMismatchException",
          message: "Invalid verification code.",
        }),
    });

    await expect(
      cognitoConfirmSignup("user@example.com", "wrong"),
    ).rejects.toThrow("Invalid verification code.");
  });
});
