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
  openExternal(url: string): Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
