import { checkCommand } from "./checkCommand.js";
import { connectToSandbox } from "./connectToSandbox.js";
import { execCommand } from "./execCommand.js";
import { launchInstance, tryQuickConnect } from "./launchSandbox.js";
import { fanOut, subscribe } from "./notifySubscription.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchInstance,
  tryQuickConnect,
  connectToSandbox,
  execCommand,
  checkCommand,
  terminateSandbox,
  subscribe,
  fanOut,
};

export type SandboxService = typeof sandboxService;
