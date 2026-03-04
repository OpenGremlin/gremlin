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
import { launchSandbox } from "./launchSandbox.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
  connectToSandbox,
  execCommand,
  terminateSandbox,
  browserStatus,
  browserNavigate,
  browserScreenshot,
  browserClick,
  browserType,
  browserEvaluate,
  browserGetContent,
};

export type SandboxService = typeof sandboxService;
