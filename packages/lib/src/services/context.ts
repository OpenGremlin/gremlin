import type { Logger } from "../logger.js";
import type { Resources } from "../resources/index.js";
import type { Services } from "./index.js";

export interface AuthUser {
  sub: string;
  email: string;
}

export interface ServiceContext {
  resources: Resources;
  services: Services;
  user?: AuthUser;
  mediaCdnUrl: string;
  log: Logger;
}
