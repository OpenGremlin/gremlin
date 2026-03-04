import { OAuth2Client } from "google-auth-library";
import { getOAuthCredentials } from "../oauth/getOAuthCredentials.js";

let cachedClient: OAuth2Client | null = null;

/**
 * Returns a Google OAuth2Client for use by Gmail/Docs tools that need the
 * full google-auth-library client. Credentials are fetched via the shared
 * OAuth credentials helper.
 */
export async function getGoogleOAuthClient(): Promise<OAuth2Client> {
  if (cachedClient) return cachedClient;

  const { clientId, clientSecret } = await getOAuthCredentials(
    "gremlin/google-oauth",
  );

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "http://localhost:3001/auth/google/callback";

  cachedClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  return cachedClient;
}
