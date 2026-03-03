import { connectApiKey } from "./connectApiKey.js";
import { connectIntegration } from "./connectIntegration.js";
import { disableBedrockModel } from "./disableBedrockModel.js";
import { enableBedrockModel } from "./enableBedrockModel.js";
import { getActiveModel } from "./getActiveModel.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";
import { getConnections } from "./getConnections.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { getProviderApiKey } from "./getProviderApiKey.js";
import { renameConnection } from "./renameConnection.js";
import { revokeConnection } from "./revokeConnection.js";
import { setActiveModel } from "./setActiveModel.js";
import { describeScopes } from "./describeScopes.js";

export const integrationService = {
  connectApiKey,
  connectIntegration,
  describeScopes,
  disableBedrockModel,
  enableBedrockModel,
  getActiveModel,
  getBedrockEnabledModels,
  getConnections,
  getIntegration,
  getIntegrations,
  getProviderApiKey,
  renameConnection,
  revokeConnection,
  setActiveModel,
};

export type IntegrationService = typeof integrationService;
