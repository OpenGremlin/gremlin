import { launchSandbox } from "./launchSandbox.js";
import { connectToSandbox, execCommand } from "./execCommand.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
  connectToSandbox,
  execCommand,
  terminateSandbox,
};

export type SandboxService = typeof sandboxService;
