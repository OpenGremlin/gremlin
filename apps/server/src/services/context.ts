import type { AuthUser } from "../gql/auth.js";
import type { Resources } from "../resources/index.js";
import type { Services } from "./index.js";

export interface ServiceContext {
  resources: Resources;
  services: Services;
  user?: AuthUser;
  mediaCdnUrl: string;
}
