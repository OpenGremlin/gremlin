import type { Resources } from "../../resources/index.js";
import { getAccessToken } from "../oauth/getAccessToken.js";

/**
 * Get a valid Google access token. Finds the first active Google OAuth
 * connection and refreshes the token if needed.
 */
export async function getGoogleAccessToken(
  resources: Resources,
  userId: string,
): Promise<string> {
  return getAccessToken(resources, "google", userId);
}
