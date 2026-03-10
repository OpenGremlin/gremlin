import Constants from "expo-constants";

interface AppConfig {
  apiUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
  skipAuth: boolean;
}

function getConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    apiUrl: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "",
    cognitoDomain:
      extra.cognitoDomain ?? process.env.EXPO_PUBLIC_COGNITO_DOMAIN ?? "",
    cognitoClientId:
      extra.cognitoClientId ?? process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? "",
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
