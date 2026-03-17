import type { Resources } from "../../resources/index.js";
import { getEnabledModels } from "./getEnabledModels.js";

/** @deprecated Use getEnabledModels(resources, "bedrock") instead */
export async function getBedrockEnabledModels(
  resources: Resources,
): Promise<string[]> {
  return getEnabledModels(resources, "bedrock");
}
