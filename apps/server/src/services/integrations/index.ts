import { disconnectIntegration } from "./disconnectIntegration.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { setIntegrationEnabled } from "./setIntegrationEnabled.js";
import { togglePermission } from "./togglePermission.js";

export const integrationService = {
  disconnectIntegration,
  getIntegrations,
  getIntegration,
  setIntegrationEnabled,
  togglePermission,
};

export type IntegrationService = typeof integrationService;
