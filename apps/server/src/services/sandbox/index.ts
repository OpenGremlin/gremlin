import {
  browserClick,
  browserEvaluate,
  browserGetContent,
  browserNavigate,
  browserScreenshot,
  browserStatus,
  browserType,
} from "./browserCommands.js";
import { connectToSandbox, execCommand } from "./execCommand.js";
import { launchBrowser } from "./launchBrowser.js";
import { launchSandbox } from "./launchSandbox.js";
import { terminateBrowser } from "./terminateBrowser.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
  connectToSandbox,
  execCommand,
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
};

export type SandboxService = typeof sandboxService;
