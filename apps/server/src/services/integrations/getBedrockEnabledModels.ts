import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { Resources } from "../../resources/index.js";

const DEFAULT_ENABLED = ["us.anthropic.claude-sonnet-4-6"];

export async function getBedrockEnabledModels(
  resources: Resources,
): Promise<string[]> {
  const { Item } = await resources.ddb.entities.Setting.build(GetItemCommand)
    .key({ key: "bedrockEnabledModels" })
    .send();

  if (!Item) return DEFAULT_ENABLED;

  return JSON.parse(Item.value) as string[];
}
