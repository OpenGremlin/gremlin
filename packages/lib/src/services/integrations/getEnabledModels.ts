import type { ModelMode } from "@gremlin/providers";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { Resources } from "../../resources/index.js";

const BEDROCK_DEFAULTS: EnabledModel[] = [
  {
    id: "us.anthropic.claude-sonnet-4-6",
    name: "US Anthropic Claude Sonnet 4.6",
    mode: "chat",
  },
];

export interface EnabledModel {
  id: string;
  name: string;
  mode: ModelMode;
  maxInputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  supportedModalities?: string[];
  supportedOutputModalities?: string[];
  inputCostPerImage?: number;
  inputCostPerImageToken?: number;
  outputCostPerImage?: number;
  outputCostPerImageToken?: number;
}

function settingKey(providerId: string): string {
  return `enabledModels:${providerId}`;
}

/** Map legacy `type` values to `mode` */
const TYPE_TO_MODE: Record<string, ModelMode> = {
  llm: "chat",
  image: "image_generation",
};

/**
 * Migrate legacy formats to the current EnabledModel shape.
 * Handles bare string IDs and old objects with `type` instead of `mode`.
 */
function migrateIfNeeded(raw: unknown[]): EnabledModel[] {
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return { id: entry, name: entry, mode: "chat" as ModelMode };
    }
    const obj = entry as Record<string, unknown>;
    // Migrate legacy `type` field to `mode`
    if (obj.type && !obj.mode) {
      obj.mode = TYPE_TO_MODE[obj.type as string] ?? "chat";
      delete obj.type;
    }
    return obj as unknown as EnabledModel;
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
