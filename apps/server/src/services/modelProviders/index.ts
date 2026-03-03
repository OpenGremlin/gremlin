import { getActiveModel } from "./getActiveModel.js";
import { getModelProviders } from "./getModelProviders.js";
import { removeProviderApiKey } from "./removeProviderApiKey.js";
import { setActiveModel } from "./setActiveModel.js";
import { setProviderApiKey } from "./setProviderApiKey.js";

export const modelProviderService = {
  getModelProviders,
  getActiveModel,
  setProviderApiKey,
  removeProviderApiKey,
  setActiveModel,
};

export type ModelProviderService = typeof modelProviderService;
