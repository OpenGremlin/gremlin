import { getDefaultModel } from "./getDefaultModel.js";
import { getModelProviders } from "./getModelProviders.js";
import { removeProviderApiKey } from "./removeProviderApiKey.js";
import { setDefaultModel } from "./setDefaultModel.js";
import { setProviderApiKey } from "./setProviderApiKey.js";

export const modelProviderService = {
  getModelProviders,
  getDefaultModel,
  setProviderApiKey,
  removeProviderApiKey,
  setDefaultModel,
};

export type ModelProviderService = typeof modelProviderService;
