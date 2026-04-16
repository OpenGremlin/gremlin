import type { Logger } from "@opengremlin/lib/logger.js";
import type { Resources } from "@opengremlin/lib/resources/index.js";
import type { Services } from "@opengremlin/lib/services/index.js";
import { mockDeep } from "vitest-mock-extended";
import type { AuthUser } from "../gql/auth.js";
import type { GremlinContext } from "../gql/context.js";
import type { Loaders } from "../gql/loaders.js";

export interface TestContextOverrides {
  user?: AuthUser;
  serverBaseUrl?: string;
  mediaBaseUrl?: string;
  services?: Services;
  resources?: Resources;
  loaders?: Loaders;
  log?: Logger;
}

export function buildTestContext(
  overrides: TestContextOverrides = {},
): GremlinContext {
  return {
    user: overrides.user ?? { sub: "test-user", email: "test@example.com" },
    serverBaseUrl: overrides.serverBaseUrl ?? "http://localhost:3001",
    mediaBaseUrl: overrides.mediaBaseUrl ?? "http://localhost:3001/media",
    services: overrides.services ?? mockDeep<Services>(),
    resources: overrides.resources ?? mockDeep<Resources>(),
    loaders: overrides.loaders ?? mockDeep<Loaders>(),
    log: overrides.log ?? mockDeep<Logger>(),
  };
}
