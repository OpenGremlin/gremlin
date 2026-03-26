import type { ModelType } from "@gremlin/providers";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { Resources } from "../../resources/index.js";

const BEDROCK_DEFAULTS: EnabledModel[] = [
  {
    id: "us.anthropic.claude-sonnet-4-6",
    name: "US Anthropic Claude Sonnet 4.6",
    type: "llm",
    contextWindow: 0,
    maxTokens: 0,
    reasoning: false,
  },
];

export interface EnabledModel {
  id: string;
  name: string;
  type: ModelType;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  inputCost?: number;
  outputCost?: number;
  supportedModalities?: string[];
  supportedOutputModalities?: string[];
  outputCostPerImage?: number;
}

function settingKey(providerId: string): string {
  return `enabledModels:${providerId}`;
}

/**
 * Migrate bare string IDs (old format) to EnabledModel objects.
 * Old format: ["model-a", "model-b"]
 * New format: [{ id: "model-a", name: "model-a", type: "llm", ... }]
 */
function migrateIfNeeded(raw: unknown[]): EnabledModel[] {
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return {
        id: entry,
        name: entry,
        type: "llm" as ModelType,
        contextWindow: 0,
        maxTokens: 0,
        reasoning: false,
      };
    }
    return entry as EnabledModel;
  });
}

export async function getEnabledModels(
  resources: Resources,
  providerId: string,
): Promise<EnabledModel[]> {
  const { Item } = await resources.ddb.entities.Setting.build(GetItemCommand)
    .key({ key: settingKey(providerId) })
    .send();

  if (Item) return migrateIfNeeded(JSON.parse(Item.value) as unknown[]);

  // Migrate: check legacy key for bedrock
  if (providerId === "bedrock") {
    const { Item: legacy } = await resources.ddb.entities.Setting.build(
      GetItemCommand,
    )
      .key({ key: "bedrockEnabledModels" })
      .send();
    if (legacy) return migrateIfNeeded(JSON.parse(legacy.value) as unknown[]);
    return [...BEDROCK_DEFAULTS];
  }

  return [];
}
