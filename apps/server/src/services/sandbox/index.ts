import {
  browserClick,
  browserEvaluate,
  browserGetContent,
  browserNavigate,
  browserScreenshot,
  browserStatus,
  browserType,
} from "./browserCommands.js";
import { checkCommand } from "./checkCommand.js";
import { connectToSandbox } from "./connectToSandbox.js";
import { execCommand } from "./execCommand.js";
import { launchBrowser } from "./launchBrowser.js";
import {
  launchInstance,
  launchSandbox,
  tryQuickConnect,
} from "./launchSandbox.js";
import { fanOut, subscribe } from "./notifySubscription.js";
import { terminateBrowser } from "./terminateBrowser.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
  launchInstance,
  tryQuickConnect,
  connectToSandbox,
  execCommand,
  checkCommand,
  terminateSandbox,
  launchBrowser,
  terminateBrowser,
  browserStatus,
  browserNavigate,
  browserScreenshot,
  browserClick,
  browserType,
  browserEvaluate,
  browserGetContent,
  subscribe,
  fanOut,
};

export type SandboxService = typeof sandboxService;
