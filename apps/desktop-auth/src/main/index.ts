import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { handleCognitoLogin } from "./cognito.js";
import { handleOAuthFlow } from "./oauth.js";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle(
  "start-oauth",
  async (
    _event,
    config: {
      providerId: string;
      clientId: string;
      clientSecret: string;
      scopes: string[];
    },
  ) => {
    return handleOAuthFlow(config);
  },
);

ipcMain.handle(
  "cognito-login",
  async (_event, config: { cognitoDomain: string; clientId: string }) => {
    return handleCognitoLogin(config);
  },
);

ipcMain.handle("open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});
