import type { ServiceContext } from "../context.js";
import { providers } from "./providers.js";

export async function connectIntegration(
  ctx: ServiceContext,
  provider: string,
): Promise<string> {
  const def = providers.find((p) => p.id === provider);
  if (!def) throw new Error(`Unknown provider: ${provider}`);

  switch (provider) {
    case "google":
      return ctx.services.google.generateGoogleAuthUrl(ctx);
    default:
      throw new Error(`Provider "${provider}" does not support connect yet`);
  }
}
