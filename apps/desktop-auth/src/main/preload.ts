import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  startOAuth: (config: {
    providerId: string;
    clientId: string;
    scopes: string[];
  }) => ipcRenderer.invoke("start-oauth", config),

  cognitoLogin: (config: { cognitoDomain: string; clientId: string }) =>
    ipcRenderer.invoke("cognito-login", config),

  cognitoRefresh: (config: {
    cognitoDomain: string;
    clientId: string;
    refreshToken: string;
  }) => ipcRenderer.invoke("cognito-refresh", config),

  cancelAuthFlow: () => ipcRenderer.invoke("cancel-auth-flow"),

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
});
