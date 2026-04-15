import type { SafeIntegrationConnection } from "@opengremlin/lib/services/integrations/getConnections.js";
import type { GremlinContext } from "../../context.js";

/**
 * Per-request cache for connections to avoid repeated DynamoDB scans
 * when resolving connectionCount + hasConnection across multiple providers.
 * Keyed on ctx (created fresh per request), NOT ctx.resources (a singleton).
 */
const connectionsCache = new WeakMap<
  object,
  Promise<SafeIntegrationConnection[]>
>();

export function getConnectionsCached(
  ctx: GremlinContext,
): Promise<SafeIntegrationConnection[]> {
  let cached = connectionsCache.get(ctx);
  if (!cached) {
    cached = ctx.services.integrations.getConnections(ctx.resources);
    connectionsCache.set(ctx, cached);
  }
  return cached;
}
