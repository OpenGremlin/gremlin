import { generateGoogleAuthUrl } from "./generateAuthUrl.js";
import { handleGoogleCallback } from "./handleCallback.js";
import { getGoogleAccessToken } from "./getGoogleTokens.js";

export const googleService = {
  generateGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleAccessToken,
};

export type GoogleService = typeof googleService;
