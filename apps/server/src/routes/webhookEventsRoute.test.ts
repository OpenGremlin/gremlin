import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { createWebhookEventsRoute } from "./webhookEventsRoute.js";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function buildHandler() {
  const resources = mockDeep<Resources>();
  const services = mockDeep<Services>();
  // mockDeep returns auto-mocks; set defaults for the primitives and predicates
  // the route reads on every request.
  (
    services.webhooks as unknown as { MAX_EVENTS_PER_BATCH: number }
  ).MAX_EVENTS_PER_BATCH = 100;
  services.webhooks.isValidTopic.mockReturnValue(true);
  const handler = createWebhookEventsRoute(resources, services);
  return { handler, resources, services };
}

const validBody = {
  topic: "test:hello",
  events: [{ id: "e1", payload: { hi: "there" } }],
};

describe("webhookEventsRoute", () => {
  it("401 when authorization header is missing", async () => {
    const { handler } = buildHandler();
    const res = mockRes();

    await handler({ headers: {}, body: validBody } as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("401 when key does not verify", async () => {
    const { handler, services } = buildHandler();
    services.webhooks.verifyKey.mockResolvedValue(null);
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_bad" },
        body: validBody,
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("400 when body is missing required fields", async () => {
    const { handler, services } = buildHandler();
    services.webhooks.verifyKey.mockResolvedValue({
      webhook: {
        id: "wh-1",
        name: "n",
        scopes: ["test:*"],
        createdAt: "",
        revokedAt: null,
      },
      key: {
        id: "k-1",
        webhookId: "wh-1",
        hash: "k-1",
        prefix: "grm_whk_xxxx",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_ok" },
        body: { topic: "test:hello" }, // events missing
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("403 when topic does not match scopes", async () => {
    const { handler, services } = buildHandler();
    services.webhooks.verifyKey.mockResolvedValue({
      webhook: {
        id: "wh-1",
        name: "n",
        scopes: ["other:*"],
        createdAt: "",
        revokedAt: null,
      },
      key: {
        id: "k-1",
        webhookId: "wh-1",
        hash: "k-1",
        prefix: "grm_whk_xxxx",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    services.webhooks.scopeMatch.mockReturnValue(false);
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_ok" },
        body: validBody,
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("413 when batch exceeds MAX_EVENTS_PER_BATCH", async () => {
    const { handler, services } = buildHandler();
    (
      services.webhooks as unknown as { MAX_EVENTS_PER_BATCH: number }
    ).MAX_EVENTS_PER_BATCH = 2;
    services.webhooks.verifyKey.mockResolvedValue({
      webhook: {
        id: "wh-1",
        name: "n",
        scopes: ["test:*"],
        createdAt: "",
        revokedAt: null,
      },
      key: {
        id: "k-1",
        webhookId: "wh-1",
        hash: "k-1",
        prefix: "grm_whk_xxxx",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_ok" },
        body: {
          topic: "test:hello",
          events: [{ id: "e1" }, { id: "e2" }, { id: "e3" }],
        },
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(413);
  });

  it("400 when topic has forbidden characters", async () => {
    const { handler, services } = buildHandler();
    services.webhooks.isValidTopic.mockReturnValue(false);
    services.webhooks.verifyKey.mockResolvedValue({
      webhook: {
        id: "wh-1",
        name: "n",
        scopes: ["*"],
        createdAt: "",
        revokedAt: null,
      },
      key: {
        id: "k-1",
        webhookId: "wh-1",
        hash: "k-1",
        prefix: "grm_whk_xxxx",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_ok" },
        body: { topic: "has spaces", events: [{ id: "e1" }] },
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("202 with accepted/deduped counts on success", async () => {
    const { handler, services } = buildHandler();
    services.webhooks.verifyKey.mockResolvedValue({
      webhook: {
        id: "wh-1",
        name: "n",
        scopes: ["test:*"],
        createdAt: "",
        revokedAt: null,
      },
      key: {
        id: "k-1",
        webhookId: "wh-1",
        hash: "k-1",
        prefix: "grm_whk_xxxx",
        createdAt: "",
        lastUsedAt: null,
        revokedAt: null,
      },
    });
    services.webhooks.scopeMatch.mockReturnValue(true);
    services.webhooks.ingestEvents.mockResolvedValue({
      accepted: 1,
      deduped: 0,
    });
    const res = mockRes();

    await handler(
      {
        headers: { authorization: "Bearer grm_whk_ok" },
        body: validBody,
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ accepted: 1, deduped: 0 });
    expect(services.webhooks.touchKey).toHaveBeenCalled();
  });
});
