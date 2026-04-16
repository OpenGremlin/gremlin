import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { buildContext } from "../shared/buildContext.js";
import type { AuthUser } from "./auth.js";
import type { GremlinContext } from "./context.js";

export interface HttpContextDeps {
  skipAuth: boolean;
  userByRequest: WeakMap<Request, AuthUser>;
  getServerBaseUrl: () => Promise<string>;
  resources: Resources;
  services: Services;
}

export function createHttpContext(deps: HttpContextDeps) {
  return async ({ request }: { request: Request }): Promise<GremlinContext> => {
    let user: AuthUser;
    if (deps.skipAuth) {
      user = { sub: "local", email: "local@dev" };
    } else {
      const attached = deps.userByRequest.get(request);
      if (!attached) {
        // The auth plugin should have attached a user or short-circuited with 401.
        // Reaching here means a plugin ordering or wiring bug — fail loudly rather than
        // handing an undefined user to resolvers.
        throw new Error("Unauthorized");
      }
      user = attached;
    }
    const serverBaseUrl = await deps.getServerBaseUrl();
    return buildContext({
      user,
      serverBaseUrl,
      resources: deps.resources,
      services: deps.services,
      component: "graphql",
    });
  };
}
