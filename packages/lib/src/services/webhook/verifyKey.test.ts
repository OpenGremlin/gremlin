import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Resources } from "../../resources/index.js";
import { hashKey } from "./keyFormat.js";
import { verifyKey } from "./verifyKey.js";

describe("verifyKey", () => {
  let resources: ReturnType<typeof mockDeep<Resources>>;

  function mockEntityGets(opts: { keyItem?: unknown; webhookItem?: unknown }) {
    // dynamodb-toolbox's entity.build(GetItemCommand).key().send() chain —
    // we stub .send on each entity's build chain to return the item we want.
    const makeBuild = (item: unknown) => ({
      key: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue({ Item: item }),
    });
    resources.ddb.entities.WebhookKey.build = vi
      .fn()
      .mockReturnValue(makeBuild(opts.keyItem));
    resources.ddb.entities.Webhook.build = vi
      .fn()
      .mockReturnValue(makeBuild(opts.webhookItem));
  }

  beforeEach(() => {
    resources = mockDeep<Resources>();
  });

  it("returns null for empty plaintext without hitting DB", async () => {
    const result = await verifyKey(resources, "");
    expect(result).toBeNull();
  });

  it("returns null when no key row matches the hash", async () => {
    mockEntityGets({ keyItem: undefined });

    const result = await verifyKey(resources, "grm_whk_unknown");

    expect(result).toBeNull();
  });

  it("returns null when the key is revoked", async () => {
    mockEntityGets({
      keyItem: {
        id: hashKey("grm_whk_test"),
        webhookId: "wh-1",
        revokedAt: "2026-04-18T00:00:00Z",
      },
    });

    const result = await verifyKey(resources, "grm_whk_test");

    expect(result).toBeNull();
  });

  it("returns null when the parent webhook is revoked", async () => {
    mockEntityGets({
      keyItem: {
        id: hashKey("grm_whk_test"),
        webhookId: "wh-1",
        revokedAt: null,
      },
      webhookItem: {
        id: "wh-1",
        revokedAt: "2026-04-18T00:00:00Z",
      },
    });

    const result = await verifyKey(resources, "grm_whk_test");

    expect(result).toBeNull();
  });

  it("returns the pair when both are active", async () => {
    const key = {
      id: hashKey("grm_whk_ok"),
      webhookId: "wh-1",
      revokedAt: null,
    };
    const webhook = {
      id: "wh-1",
      name: "Gmail",
      scopes: ["gmail:*"],
      revokedAt: null,
    };
    mockEntityGets({ keyItem: key, webhookItem: webhook });

    const result = await verifyKey(resources, "grm_whk_ok");

    expect(result).toEqual({ key, webhook });
  });
});
