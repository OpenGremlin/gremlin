import type { ServiceContext } from "../context.js";
import { generateAuthUrl } from "../oauth/generateAuthUrl.js";

export async function generateGoogleAuthUrl(
  ctx: ServiceContext,
  scopes: string[],
): Promise<string> {
  return generateAuthUrl(ctx, "google", scopes);
}
