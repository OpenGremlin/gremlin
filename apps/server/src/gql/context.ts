import type { Logger } from "@gremlin/lib/logger.js";
import type { Resources } from "@gremlin/lib/resources/index.js";
import type { AuthUser } from "@gremlin/lib/services/context.js";
import type { Services } from "@gremlin/lib/services/index.js";
import type { Loaders } from "./loaders.js";

export interface GremlinContext {
  user?: AuthUser;
  mediaCdnUrl: string;
  resources: Resources;
  services: Services;
  loaders: Loaders;
  log: Logger;
}
