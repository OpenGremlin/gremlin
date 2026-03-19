import { createLogger, type Logger } from "../logger.js";
import { createResources, type Resources } from "../resources/index.js";
import type { PubSub } from "../resources/pubsub.js";
import { createServices, type Services } from "./index.js";

export interface AuthUser {
  sub: string;
  email: string;
}

export interface ServiceContext {
  resources: Resources;
  services: Services;
  user?: AuthUser;
  mediaBaseUrl: string;
  log: Logger;
}

/**
 * Build a ServiceContext from the current environment.
 * Call once at startup (or once in a CLI script) and reuse everywhere.
 */
export function createServiceContext(opts: {
  pubsub: PubSub;
  mediaBaseUrl?: string;
  logNamespace?: string;
}): ServiceContext {
  return {
    resources: createResources(opts.pubsub),
    services: createServices(),
    mediaBaseUrl: opts.mediaBaseUrl ?? process.env.MEDIA_BASE_URL ?? "",
    log: createLogger(opts.logNamespace ?? "svc"),
  };
}
