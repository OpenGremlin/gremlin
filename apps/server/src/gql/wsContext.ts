import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { buildContext } from "../shared/buildContext.js";
import { type AuthUser, verifyToken as defaultVerifyToken } from "./auth.js";
import type { GremlinContext } from "./context.js";

export interface WsContextDeps {
  skipAuth: boolean;
  getServerBaseUrl: () => Promise<string>;
  resources: Resources;
  services: Services;
  verifyToken?: (token: string) => Promise<AuthUser>;
}

export function createWsContext(deps: WsContextDeps) {
  const verify = deps.verifyToken ?? defaultVerifyToken;
  return async (ctx: {
    connectionParams?: Record<string, unknown>;
  }): Promise<GremlinContext> => {
    const token = ctx.connectionParams?.token as string | undefined;
    let user: AuthUser;
    if (deps.skipAuth) {
      user = { sub: "local", email: "local@dev" };
    } else {
      if (!token) throw new Error("Unauthorized");
      user = await verify(token);
    }
    const serverBaseUrl = await deps.getServerBaseUrl();
    return buildContext({
      user,
      serverBaseUrl,
      resources: deps.resources,
      services: deps.services,
      component: "ws",
    });
  };
}
