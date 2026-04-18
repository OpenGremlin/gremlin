import { createLogger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import type { Request, Response } from "express";

const log = createLogger("webhook-events");

interface InboundEnvelope {
  topic: unknown;
  events: unknown;
}

type ParseResult =
  | {
      ok: true;
      topic: string;
      events: Array<{ id: string; [k: string]: unknown }>;
    }
  | { ok: false; status: 400 | 413; error: string };

function parseEnvelope(body: unknown, maxEvents: number): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "body must be a JSON object" };
  }
  const { topic, events } = body as InboundEnvelope;
  if (typeof topic !== "string" || !topic) {
    return {
      ok: false,
      status: 400,
      error: "topic must be a non-empty string",
    };
  }
  if (!Array.isArray(events) || events.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "events must be a non-empty array",
    };
  }
  if (events.length > maxEvents) {
    return {
      ok: false,
      status: 413,
      error: `too many events; max ${maxEvents} per request`,
    };
  }
  const validated: Array<{ id: string; [k: string]: unknown }> = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e || typeof e !== "object") {
      return {
        ok: false,
        status: 400,
        error: `events[${i}] must be a JSON object`,
      };
    }
    const { id } = e as { id?: unknown };
    if (typeof id !== "string" || !id) {
      return {
        ok: false,
        status: 400,
        error: `events[${i}].id must be a non-empty string`,
      };
    }
    validated.push(e as { id: string; [k: string]: unknown });
  }
  return { ok: true, topic, events: validated };
}

export function createWebhookEventsRoute(
  resources: Resources,
  services: Services,
) {
  return async function webhookEventsRoute(
    req: Request,
    res: Response,
  ): Promise<void> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "missing bearer token" });
      return;
    }
    const plaintext = header.slice("Bearer ".length).trim();

    const verified = await services.webhooks.verifyKey(resources, plaintext);
    if (!verified) {
      res.status(401).json({ error: "invalid or revoked key" });
      return;
    }

    const parsed = parseEnvelope(
      req.body,
      services.webhooks.MAX_EVENTS_PER_BATCH,
    );
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.error });
      return;
    }

    if (!services.webhooks.isValidTopic(parsed.topic)) {
      res.status(400).json({
        error:
          "topic must be 1-200 chars of [a-zA-Z0-9:_.@-] (no spaces or special chars)",
      });
      return;
    }

    if (!services.webhooks.scopeMatch(verified.webhook.scopes, parsed.topic)) {
      res.status(403).json({
        error: `topic '${parsed.topic}' is not in this webhook's scopes`,
      });
      return;
    }

    try {
      const result = await services.webhooks.ingestEvents(resources, {
        webhookId: verified.webhook.id,
        topic: parsed.topic,
        events: parsed.events,
      });
      services.webhooks.touchKey(resources, verified.key.id);

      log.info(
        {
          webhookId: verified.webhook.id,
          topic: parsed.topic,
          accepted: result.accepted,
          deduped: result.deduped,
        },
        "Ingested webhook events",
      );

      res.status(202).json(result);
    } catch (err) {
      log.error({ err, component: "webhook-events" }, "Ingest failed");
      res.status(500).json({ error: "ingest failed" });
    }
  };
}
