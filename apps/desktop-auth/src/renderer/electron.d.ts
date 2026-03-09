interface ElectronAPI {
  startOAuth(config: {
    providerId: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  }): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    accountId?: string;
    scopes: string[];
  }>;
  cognitoLogin(config: {
    cognitoDomain: string;
    clientId: string;
  }): Promise<{
    idToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
  cognitoRefresh(config: {
    cognitoDomain: string;
    clientId: string;
    refreshToken: string;
  }): Promise<{
    idToken: string;
    expiresIn: number;
  }>;
  cancelAuthFlow(): Promise<void>;
  openExternal(url: string): Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
