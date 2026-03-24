import { describe, expect, it, vi } from "vitest";
import {
  buildConnectUrl,
  decodeQrPayload,
  encodeBase64Url,
  fetchServerConfig,
  isValidCognitoDomain,
} from "./connectUtils";

describe("encodeBase64Url", () => {
  it("encodes a simple URL", () => {
    const result = encodeBase64Url("https://example.com");
    expect(result).toBe("aHR0cHM6Ly9leGFtcGxlLmNvbQ");
  });

  it("replaces + with - and / with _", () => {
    // A string that produces + and / in standard base64
    const result = encodeBase64Url("subjects?_d");
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("strips padding characters", () => {
    // "a" in base64 is "YQ==" — should strip the ==
    const result = encodeBase64Url("a");
    expect(result).toBe("YQ");
  });
});

describe("decodeQrPayload", () => {
  it("decodes a universal link payload", () => {
    const url = "https://d1234.cloudfront.net";
    const encoded = encodeBase64Url(url);
    const result = decodeQrPayload(
      `https://opengremlin.com/connect/${encoded}`,
    );
    expect(result).toBe(url);
  });

  it("decodes a legacy gremlin:// payload", () => {
    const url = "https://d1234.cloudfront.net";
    const encoded = encodeBase64Url(url);
    const result = decodeQrPayload(`gremlin://connect/${encoded}`);
    expect(result).toBe(url);
  });

  it("returns null for unrelated URLs", () => {
    expect(decodeQrPayload("https://example.com")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeQrPayload("")).toBeNull();
  });

  it("returns null for invalid base64", () => {
    expect(
      decodeQrPayload("https://opengremlin.com/connect/!!!invalid!!!"),
    ).toBeNull();
  });

  it("returns null for wrong scheme", () => {
    expect(decodeQrPayload("other://connect/abc")).toBeNull();
  });
});

describe("buildConnectUrl + decodeQrPayload round-trip", () => {
  const urls = [
    "https://d1234abcdef.cloudfront.net",
    "https://my-app.example.com",
    "https://gremlin.company.io:8443",
    "https://example.com/path?query=1&other=2",
  ];

  for (const url of urls) {
    it(`round-trips ${url}`, () => {
      const qr = buildConnectUrl(url);
      expect(qr).toMatch(/^https:\/\/opengremlin\.com\/connect\//);
      const decoded = decodeQrPayload(qr);
      expect(decoded).toBe(url);
    });
  }
});

describe("isValidCognitoDomain", () => {
  it("accepts a valid Cognito domain", () => {
    expect(
      isValidCognitoDomain("my-app.auth.us-east-1.amazoncognito.com"),
    ).toBe(true);
  });

  it("accepts domains with different regions", () => {
    expect(isValidCognitoDomain("test.auth.eu-west-1.amazoncognito.com")).toBe(
      true,
    );
  });

  it("rejects domains not matching Cognito pattern", () => {
    expect(isValidCognitoDomain("evil.example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidCognitoDomain("")).toBe(false);
  });

  it("rejects domain with path", () => {
    expect(
      isValidCognitoDomain("my-app.auth.us-east-1.amazoncognito.com/extra"),
    ).toBe(false);
  });
});

describe("fetchServerConfig", () => {
  it("throws on non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    await expect(fetchServerConfig("https://example.com")).rejects.toThrow(
      "Server returned 404",
    );
    vi.unstubAllGlobals();
  });

  it("throws on missing required fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
    await expect(fetchServerConfig("https://example.com")).rejects.toThrow(
      "missing required fields",
    );
    vi.unstubAllGlobals();
  });

  it("throws on invalid Cognito domain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cognitoDomain: "evil.example.com",
          clientId: "abc123",
        }),
      }),
    );
    await expect(fetchServerConfig("https://example.com")).rejects.toThrow(
      "Invalid Cognito domain",
    );
    vi.unstubAllGlobals();
  });

  it("returns valid config", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
          clientId: "abc123",
        }),
      }),
    );
    const cfg = await fetchServerConfig("https://d1234.cloudfront.net");
    expect(cfg).toEqual({
      serverUrl: "https://d1234.cloudfront.net",
      cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
      cognitoClientId: "abc123",
    });
    vi.unstubAllGlobals();
  });

  it("uses input URL as serverUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
          clientId: "abc123",
        }),
      }),
    );
    const cfg = await fetchServerConfig("https://my-server.com");
    expect(cfg.serverUrl).toBe("https://my-server.com");
    vi.unstubAllGlobals();
  });

  it("maps clientId from response to cognitoClientId in config", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
          clientId: "server-client-id-123",
        }),
      }),
    );
    const cfg = await fetchServerConfig("https://example.com");
    expect(cfg.cognitoClientId).toBe("server-client-id-123");
    // Should not have a clientId field — only cognitoClientId
    expect(cfg).not.toHaveProperty("clientId");
    vi.unstubAllGlobals();
  });

  it("throws when cognitoDomain is present but clientId is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
        }),
      }),
    );
    await expect(fetchServerConfig("https://example.com")).rejects.toThrow(
      "missing required fields",
    );
    vi.unstubAllGlobals();
  });

  it("throws when clientId is present but cognitoDomain is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ clientId: "abc123" }),
      }),
    );
    await expect(fetchServerConfig("https://example.com")).rejects.toThrow(
      "missing required fields",
    );
    vi.unstubAllGlobals();
  });

  it("strips trailing slash and hits /api/auth-config", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cognitoDomain: "my-app.auth.us-east-1.amazoncognito.com",
        clientId: "abc123",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);
    await fetchServerConfig("https://my-server.com/");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://my-server.com/api/auth-config",
    );
    vi.unstubAllGlobals();
  });
});
