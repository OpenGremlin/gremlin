import { connectIntegration } from "./connectIntegration.js";
import { getConnections } from "./getConnections.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { revokeConnection } from "./revokeConnection.js";
import { describeScopes } from "./describeScopes.js";

export const integrationService = {
  connectIntegration,
  describeScopes,
  getConnections,
  getIntegration,
  getIntegrations,
  revokeConnection,
};

export type IntegrationService = typeof integrationService;
