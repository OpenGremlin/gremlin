import type { Logger } from "../logger.js";
import type { Resources } from "../resources/index.js";
import type { Services } from "../services/index.js";
import type { AuthUser } from "./auth.js";
import type { Loaders } from "./loaders.js";

export interface GremlinContext {
  user?: AuthUser;
  mediaCdnUrl: string;
  resources: Resources;
  services: Services;
  loaders: Loaders;
  log: Logger;
}
