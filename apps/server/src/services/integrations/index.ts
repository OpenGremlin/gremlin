import { connectIntegration } from "./connectIntegration.js";
import { disconnectIntegration } from "./disconnectIntegration.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";

export const integrationService = {
  connectIntegration,
  disconnectIntegration,
  getIntegrations,
  getIntegration,
};

export type IntegrationService = typeof integrationService;
