import type { ServiceContext } from "../context.js";
import { providers } from "./providers.js";

export async function connectIntegration(
  ctx: ServiceContext,
  providerId: string,
  scopes: string[],
): Promise<string> {
  const def = providers.find((p) => p.id === providerId);
  if (!def) throw new Error(`Unknown provider: ${providerId}`);

  switch (providerId) {
    case "google":
      return ctx.services.google.generateGoogleAuthUrl(ctx, scopes);
    default:
      throw new Error(
        `Provider "${providerId}" does not support connect yet`,
      );
  }
}
