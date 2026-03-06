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
import { launchSandbox } from "./launchSandbox.js";
import {
  acquireSandboxLock,
  addSandboxWaiter,
  releaseSandboxLock,
  updateLockStatus,
} from "./sandboxLock.js";
import { terminateBrowser } from "./terminateBrowser.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
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
  acquireSandboxLock,
  addSandboxWaiter,
  releaseSandboxLock,
  updateLockStatus,
};

export type SandboxService = typeof sandboxService;
