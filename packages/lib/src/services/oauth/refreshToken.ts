import type { TokenResult } from "./configs.js";
import { getAdapter } from "./getAdapter.js";

export async function refreshOAuthToken(
  providerId: string,
  refreshToken: string,
): Promise<TokenResult> {
  const adapter = await getAdapter(providerId);
  if (!adapter.refreshAccessToken) {
    throw new Error(`Provider ${providerId} does not support token refresh`);
  }
  return adapter.refreshAccessToken(refreshToken);
}
