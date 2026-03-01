import type { AuthUser } from "./auth.js";
import type { Resources } from "../resources/index.js";
import type { Services } from "../services/index.js";

export interface GremlinContext {
  user?: AuthUser;
  mediaCdnUrl: string;
  resources: Resources;
  services: Services;
}
