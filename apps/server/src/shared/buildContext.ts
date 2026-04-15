import { logger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import type { AuthUser } from "../gql/auth.js";
import type { GremlinContext } from "../gql/context.js";
import { createLoaders } from "../gql/loaders.js";

export function buildContext(opts: {
  user: AuthUser;
  serverBaseUrl: string;
  resources: Resources;
  services: Services;
  component: string;
}): GremlinContext {
  return {
    user: opts.user,
    serverBaseUrl: opts.serverBaseUrl,
    mediaBaseUrl: `${opts.serverBaseUrl}/media`,
    resources: opts.resources,
    services: opts.services,
    loaders: createLoaders(opts.resources),
    log: logger.child({
      requestId: crypto.randomUUID(),
      userId: opts.user.sub,
      component: opts.component,
    }),
  };
}
