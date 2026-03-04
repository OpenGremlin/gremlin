import { generateGoogleAuthUrl } from "./generateAuthUrl.js";
import { getGoogleAccessToken } from "./getGoogleTokens.js";
import { handleGoogleCallback } from "./handleCallback.js";

export const googleService = {
  generateGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleAccessToken,
};

export type GoogleService = typeof googleService;
