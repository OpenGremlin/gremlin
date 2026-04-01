import { connectApiKey } from "./connectApiKey.js";
import { connectAwsIamRole } from "./connectAwsIamRole.js";
import { describeScopes } from "./describeScopes.js";
import { disableBedrockModel } from "./disableBedrockModel.js";
import { disableModel } from "./disableModel.js";
import { enableBedrockModel } from "./enableBedrockModel.js";
import { enableModel } from "./enableModel.js";
import { getAllEnabledModels } from "./getAllEnabledModels.js";
import { getAwsPresetRoles } from "./getAwsPresetRoles.js";
import { getAwsTrustPolicy } from "./getAwsTrustPolicy.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";
import { getConnections } from "./getConnections.js";
import { getDefaultModel } from "./getDefaultModel.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { getIntegration } from "./getIntegration.js";
import { getIntegrations } from "./getIntegrations.js";
import { getProviderApiKey } from "./getProviderApiKey.js";
import { listBedrockModels } from "./listBedrockModels.js";
import { listProviderModels } from "./listProviderModels.js";
import { revokeConnection } from "./revokeConnection.js";
import { setDefaultModel } from "./setDefaultModel.js";
import { submitOAuthConnection } from "./submitOAuthConnection.js";

export const integrationService = {
  connectApiKey,
  connectAwsIamRole,
  describeScopes,
  getAwsPresetRoles,
  getAwsTrustPolicy,
  disableBedrockModel,
  disableModel,
  enableBedrockModel,
  enableModel,
  getAllEnabledModels,
  getDefaultModel,
  getBedrockEnabledModels,
  getConnections,
  getEnabledModels,
  getIntegration,
  getIntegrations,
  getProviderApiKey,
  listBedrockModels,
  listProviderModels,
  revokeConnection,
  setDefaultModel,
  submitOAuthConnection,
};

export type IntegrationService = typeof integrationService;
