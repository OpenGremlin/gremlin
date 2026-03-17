import type { Resources } from "../../resources/index.js";
import { enableModel } from "./enableModel.js";

/** @deprecated Use enableModel(resources, "bedrock", modelId) instead */
export async function enableBedrockModel(
  resources: Resources,
  modelId: string,
): Promise<boolean> {
  return enableModel(resources, "bedrock", modelId);
}
