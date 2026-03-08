import type { ServiceContext } from "../context.js";
import { oauthConfigs } from "../oauth/configs.js";
import { generateAuthUrl } from "../oauth/generateAuthUrl.js";
import { providers } from "./providers.js";

export async function connectIntegration(
  ctx: ServiceContext,
  providerId: string,
  scopes: string[],
): Promise<string> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);

  if (oauthConfigs.has(providerId)) {
    return generateAuthUrl(ctx, providerId, scopes);
  }

  throw new Error(`Provider "${providerId}" does not support connect yet`);
}
