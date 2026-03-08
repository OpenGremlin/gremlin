import { generateAuthUrl } from "./generateAuthUrl.js";
import { getAccessToken } from "./getAccessToken.js";
import { handleOAuthCallback } from "./handleCallback.js";
import { refreshOAuthToken } from "./refreshToken.js";

export const oauthService = {
  generateAuthUrl,
  getAccessToken,
  handleOAuthCallback,
  refreshOAuthToken,
};

export type OAuthService = typeof oauthService;

export { type OAuthProviderConfig, oauthConfigs } from "./configs.js";
export { getOAuthCredentials } from "./getOAuthCredentials.js";
