import type { AuthUser } from "./auth.js";

export interface Context {
  user?: AuthUser;
}
