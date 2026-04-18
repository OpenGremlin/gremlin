/**
 * Topic identifier — used as the publish target on POST /api/webhooks/events
 * and embedded into DDB pk/gsi1pk strings, so we cap length and restrict
 * characters to avoid surprising partition names.
 */
const TOPIC_RE = /^[a-zA-Z0-9:_.@-]{1,200}$/;

/**
 * Scope pattern — same as a topic plus an optional trailing `:*` wildcard,
 * or a single `*` for global access.
 */
const SCOPE_RE = /^(\*|[a-zA-Z0-9:_.@-]{1,200}(:\*)?)$/;

export function isValidTopic(topic: string): boolean {
  return TOPIC_RE.test(topic);
}

export function isValidScopePattern(pattern: string): boolean {
  return SCOPE_RE.test(pattern);
}

/**
 * Hard cap on events per ingest request. Body size is also capped at 1MB by
 * express.json, but explicit per-event count prevents pathological tiny-event
 * batches from spawning thousands of DDB writes.
 */
export const MAX_EVENTS_PER_BATCH = 100;
