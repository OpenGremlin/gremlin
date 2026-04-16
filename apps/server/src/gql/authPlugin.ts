import {
  logger as defaultLogger,
  type Logger,
} from "@opengremlin/lib/logger.js";
import type { Plugin } from "graphql-yoga";
import { type AuthUser, verifyToken as defaultVerifyToken } from "./auth.js";

export interface AuthPluginDeps {
  skipAuth: boolean;
  userByRequest: WeakMap<Request, AuthUser>;
  verifyToken?: (token: string) => Promise<AuthUser>;
  log?: Logger;
}

export function createAuthPlugin(deps: AuthPluginDeps): Plugin {
  const verify = deps.verifyToken ?? defaultVerifyToken;
  const log = deps.log ?? defaultLogger;
  return {
    async onRequest({ request, fetchAPI, endResponse }) {
      log.info(
        { method: request.method, url: request.url, component: "http" },
        "Incoming request",
      );

      if (deps.skipAuth || request.method === "OPTIONS") return;

      const header = request.headers.get("authorization");
      if (!header?.startsWith("Bearer ")) {
        log.warn(
          { url: request.url, component: "auth" },
          "Missing auth header",
        );
        endResponse(
          fetchAPI.Response.json(
            { errors: [{ message: "Unauthorized" }] },
            { status: 401 },
          ),
        );
        return;
      }

      try {
        const user = await verify(header.slice(7));
        deps.userByRequest.set(request, user);
      } catch (err) {
        log.error({ err, component: "auth" }, "Auth failed");
        endResponse(
          fetchAPI.Response.json(
            { errors: [{ message: "Unauthorized" }] },
            { status: 401 },
          ),
        );
      }
    },
  };
}
