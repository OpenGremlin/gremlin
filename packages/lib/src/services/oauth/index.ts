import { getAccessToken } from "./getAccessToken.js";

export const oauthService = {
  getAccessToken,
};

export type OAuthService = typeof oauthService;
