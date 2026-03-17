import type { Resources } from "../../resources/index.js";
import { disableModel } from "./disableModel.js";

/** @deprecated Use disableModel(resources, "bedrock", modelId) instead */
export async function disableBedrockModel(
  resources: Resources,
  modelId: string,
): Promise<boolean> {
  return disableModel(resources, "bedrock", modelId);
}
