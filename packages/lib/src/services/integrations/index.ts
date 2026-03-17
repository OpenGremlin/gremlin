import { connectApiKey } from "./connectApiKey.js";
import { describeScopes } from "./describeScopes.js";
import { disableBedrockModel } from "./disableBedrockModel.js";
import { enableBedrockModel } from "./enableBedrockModel.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";
import { getConnections } from "./getConnections.js";
import { getDefaultModel } from "./getDefaultModel.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { getProviderApiKey } from "./getProviderApiKey.js";
import { listProviderModels } from "./listProviderModels.js";

import { revokeConnection } from "./revokeConnection.js";
import { setDefaultModel } from "./setDefaultModel.js";
import { submitOAuthConnection } from "./submitOAuthConnection.js";

export const integrationService = {
  connectApiKey,
  describeScopes,
  disableBedrockModel,
  enableBedrockModel,
  getDefaultModel,
  getBedrockEnabledModels,
  getConnections,
  getIntegration,
  getIntegrations,
  getProviderApiKey,
  listProviderModels,
  revokeConnection,
  setDefaultModel,
  submitOAuthConnection,
};

export type IntegrationService = typeof integrationService;
