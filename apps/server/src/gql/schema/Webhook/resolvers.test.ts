import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { webhookResolvers } from "./resolvers.js";

describe("Webhook resolvers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("webhooks lists from the service", async () => {
    const rows = [{ id: "wh-1", name: "Gmail", scopes: ["gmail:*"] }];
    const ctx = buildTestContext();
    ctx.services.webhooks.listWebhooks = vi.fn().mockResolvedValue(rows);

    const result = await invokeResolver(webhookResolvers.Query.webhooks, {
      ctx,
    });

    expect(result).toBe(rows);
    expect(ctx.services.webhooks.listWebhooks).toHaveBeenCalledWith(ctx);
  });

  it("createWebhook returns plaintext key once", async () => {
    const webhook = {
      id: "wh-1",
      name: "Gmail",
      scopes: ["gmail:*"],
      createdAt: "2026-04-18T00:00:00Z",
      revokedAt: null,
    };
    const ctx = buildTestContext();
    ctx.services.webhooks.createWebhook = vi.fn().mockResolvedValue({
      webhook,
      keyId: "abc123",
      keyPlaintext: "grm_whk_secret",
    });

    const result = await invokeResolver(
      webhookResolvers.Mutation.createWebhook,
      {
        args: { name: "Gmail", scopes: ["gmail:*"] },
        ctx,
      },
    );

    expect(result).toEqual({
      webhook,
      key: "grm_whk_secret",
      keyId: "abc123",
    });
    expect(ctx.services.webhooks.createWebhook).toHaveBeenCalledWith(ctx, {
      name: "Gmail",
      scopes: ["gmail:*"],
    });
  });

  it("Webhook.lastEventAt returns max(key.lastUsedAt) across keys", async () => {
    const ctx = buildTestContext();
    ctx.loaders.webhookKeysByWebhookIdLoader.load = vi.fn().mockResolvedValue([
      { id: "k1", lastUsedAt: "2026-04-17T10:00:00Z" },
      { id: "k2", lastUsedAt: null },
      { id: "k3", lastUsedAt: "2026-04-18T05:00:00Z" },
    ]);

    const lastEventAt = webhookResolvers.Webhook
      .lastEventAt as unknown as Parameters<typeof invokeResolver>[0];
    const result = await invokeResolver(lastEventAt, {
      parent: {
        id: "wh-1",
        name: "n",
        scopes: ["x"],
        createdAt: "",
        revokedAt: null,
      },
      ctx,
    });

    expect(result).toBe("2026-04-18T05:00:00Z");
  });
});
