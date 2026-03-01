import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { togglePermission } from "./togglePermission.js";

export const integrationService = {
  getIntegrations,
  getIntegration,
  togglePermission,
};

export type IntegrationService = typeof integrationService;
