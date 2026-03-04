import type { AuthUser } from "../gql/auth.js";
import type { Logger } from "../logger.js";
import type { Resources } from "../resources/index.js";
import type { Services } from "./index.js";

export interface ServiceContext {
  resources: Resources;
  services: Services;
  user?: AuthUser;
  mediaCdnUrl: string;
  log: Logger;
}
