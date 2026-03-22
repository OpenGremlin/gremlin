import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Resources } from "../../resources/index.js";
import { providers } from "./providers.js";
import { submitOAuthConnection } from "./submitOAuthConnection.js";

const googleProvider = providers.find((p) => p.id === "google");
if (!googleProvider) throw new Error("google provider not found in registry");

describe("submitOAuthConnection", () => {
  let resources: ReturnType<typeof mockDeep<Resources>>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resources = mockDeep<Resources>();
    mockSend = vi.fn().mockResolvedValue({});
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    resources.ddb.entities.IntegrationConnection.build.mockReturnValue({
      item: mockItem,
    } as any);
  });

  it("throws for unknown provider", async () => {
    await expect(
      submitOAuthConnection(
        resources,
        "nonexistent",
        "token",
        undefined,
        undefined,
        ["scope"],
        undefined,
        undefined,
      ),
    ).rejects.toThrow("Unknown provider: nonexistent");
  });

  it("throws for non-oauth provider", async () => {
    await expect(
      submitOAuthConnection(
        resources,
        "anthropic",
        "token",
        undefined,
        undefined,
        ["scope"],
        undefined,
        undefined,
      ),
    ).rejects.toThrow("does not support OAuth connections");
  });

  it("uses tokenUrl from the provider registry, not client input", async () => {
    await submitOAuthConnection(
      resources,
      "google",
      "access-tok",
      "refresh-tok",
      "2026-01-01T00:00:00Z",
      ["gmail.readonly"],
      "user@example.com",
      "custom-client-id",
    );

    const itemCall = (resources.ddb.entities.IntegrationConnection.build as any)
      .mock.results[0].value.item.mock.calls[0][0];

    expect(itemCall.connectionMeta.tokenUrl).toBe(googleProvider.tokenUrl);
    expect(itemCall.connectionMeta.clientId).toBe("custom-client-id");
  });

  it("stores all provided fields correctly", async () => {
    const id = await submitOAuthConnection(
      resources,
      "google",
      "access-tok",
      "refresh-tok",
      "2026-01-01T00:00:00Z",
      ["gmail.readonly", "gmail.send"],
      "user@example.com",
      "my-client-id",
    );

    expect(typeof id).toBe("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const itemCall = (resources.ddb.entities.IntegrationConnection.build as any)
      .mock.results[0].value.item.mock.calls[0][0];

    expect(itemCall.providerId).toBe("google");
    expect(itemCall.connectionType).toBe("oauth");
    expect(itemCall.isRevoked).toBe(false);
    expect(itemCall.connectionMeta).toMatchObject({
      accessToken: "access-tok",
      refreshToken: "refresh-tok",
      expiresAt: "2026-01-01T00:00:00Z",
      scopes: "gmail.readonly,gmail.send",
      accountId: "user@example.com",
      clientId: "my-client-id",
      tokenUrl: googleProvider.tokenUrl,
    });
  });

  it("defaults accountId to 'unknown' when not provided", async () => {
    await submitOAuthConnection(
      resources,
      "google",
      "access-tok",
      undefined,
      undefined,
      ["gmail.readonly"],
      undefined,
      undefined,
    );

    const itemCall = (resources.ddb.entities.IntegrationConnection.build as any)
      .mock.results[0].value.item.mock.calls[0][0];

    expect(itemCall.connectionMeta.accountId).toBe("unknown");
  });
});
