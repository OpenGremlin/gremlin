import { connectToSandbox } from "./connectToSandbox.js";
import { execCommand } from "./execCommand.js";
import { launchInstance, tryQuickConnect } from "./launchSandbox.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchInstance,
  tryQuickConnect,
  connectToSandbox,
  execCommand,
  terminateSandbox,
};

export type SandboxService = typeof sandboxService;
