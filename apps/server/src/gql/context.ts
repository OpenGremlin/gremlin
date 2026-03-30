import type { Logger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { AuthUser } from "@opengremlin/lib/services/context.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import type { Loaders } from "./loaders.js";

export interface GremlinContext {
  user?: AuthUser;
  serverBaseUrl: string;
  mediaBaseUrl: string;
  resources: Resources;
  services: Services;
  loaders: Loaders;
  log: Logger;
}
