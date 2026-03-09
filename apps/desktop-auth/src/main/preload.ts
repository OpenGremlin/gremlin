import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  startOAuth: (config: {
    providerId: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  }) => ipcRenderer.invoke("start-oauth", config),

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
});
