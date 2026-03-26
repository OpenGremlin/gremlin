import type { Resources } from "../../resources/index.js";
import { type EnabledModel, getEnabledModels } from "./getEnabledModels.js";

/** @deprecated Use getEnabledModels(resources, "bedrock") instead */
export async function getBedrockEnabledModels(
  resources: Resources,
): Promise<EnabledModel[]> {
  return getEnabledModels(resources, "bedrock");
}
