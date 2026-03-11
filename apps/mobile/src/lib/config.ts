import Constants from "expo-constants";
import { Platform } from "react-native";

interface AppConfig {
  apiUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
  skipAuth: boolean;
}

declare const window: {
  __GREMLIN_CONFIG__?: {
    cognitoDomain?: string;
    cognitoClientId?: string;
    mediaCdnUrl?: string;
  };
};

function getConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra ?? {};
  // On web, config.js (injected by CDK at deploy time) sets window.__GREMLIN_CONFIG__
  const webConfig =
    Platform.OS === "web" ? window.__GREMLIN_CONFIG__ ?? {} : {};
  return {
    apiUrl: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "",
    cognitoDomain:
      webConfig.cognitoDomain ??
      extra.cognitoDomain ??
      process.env.EXPO_PUBLIC_COGNITO_DOMAIN ??
      "",
    cognitoClientId:
      webConfig.cognitoClientId ??
      extra.cognitoClientId ??
      process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ??
      "",
    skipAuth:
      extra.skipAuth === true || process.env.EXPO_PUBLIC_SKIP_AUTH === "true",
  };
}

export const config = getConfig();

export function getApiUrl(): string {
  if (__DEV__ && !config.apiUrl) {
    // Default to localhost for dev (native and web)
    return "http://localhost:3001";
  }
  return config.apiUrl;
}
