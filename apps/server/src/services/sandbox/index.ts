import { connectToSandbox, execCommand } from "./execCommand.js";
import { launchSandbox } from "./launchSandbox.js";
import { terminateSandbox } from "./terminateSandbox.js";

export const sandboxService = {
  launchSandbox,
  connectToSandbox,
  execCommand,
  terminateSandbox,
};

export type SandboxService = typeof sandboxService;
