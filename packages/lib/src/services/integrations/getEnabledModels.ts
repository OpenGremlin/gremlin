import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { Resources } from "../../resources/index.js";

const BEDROCK_DEFAULTS = ["us.anthropic.claude-sonnet-4-6"];

function settingKey(providerId: string): string {
  return `enabledModels:${providerId}`;
}

export async function getEnabledModels(
  resources: Resources,
  providerId: string,
): Promise<string[]> {
  const { Item } = await resources.ddb.entities.Setting.build(GetItemCommand)
    .key({ key: settingKey(providerId) })
    .send();

  if (Item) return JSON.parse(Item.value) as string[];

  // Migrate: check legacy key for bedrock
  if (providerId === "bedrock") {
    const { Item: legacy } = await resources.ddb.entities.Setting.build(
      GetItemCommand,
    )
      .key({ key: "bedrockEnabledModels" })
      .send();
    if (legacy) return JSON.parse(legacy.value) as string[];
    return [...BEDROCK_DEFAULTS];
  }

  return [];
}
