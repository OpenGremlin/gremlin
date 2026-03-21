import { createAllowlistStore } from "./allowlistStore.js";
import { createCommandApproval } from "./createCommandApproval.js";
import { getCommandApproval } from "./getCommandApproval.js";
import { guardCommand } from "./guardCommand.js";
import { hasPendingApproval } from "./hasPendingApproval.js";
import { resolveCommandApproval } from "./resolveCommandApproval.js";

export const shellGuardService = {
  createAllowlistStore,
  guardCommand,
  createCommandApproval,
  getCommandApproval,
  hasPendingApproval,
  resolveCommandApproval,
};

export type ShellGuardService = typeof shellGuardService;

export type { CreateCommandApprovalInput } from "./createCommandApproval.js";
export type { GuardCommandParams, GuardVerdict } from "./guardCommand.js";
export {
  DANGEROUS_PATTERNS,
  PRESETS,
  type PresetName,
  SAFE_BINS_BUILTIN,
  SAFE_BINS_DEV,
  SAFE_BINS_NETWORK,
  SAFE_BINS_READ,
} from "./presets.js";
export type { AllowlistEntry, AllowlistProvider } from "./types.js";
