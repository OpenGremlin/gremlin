import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { generateText } from "ai";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { providers } from "./providers.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";

export async function enableBedrockModel(
  resources: Resources,
  modelId: string,
): Promise<boolean> {
  const bedrockProvider = providers.find((p) => p.id === "bedrock");
  const model = bedrockProvider?.models?.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown Bedrock model: ${modelId}`);
  }

  // Test inference to verify the model is accessible
  const bedrock = createAmazonBedrock({
    credentialProvider: fromNodeProviderChain(),
  });
  await generateText({ model: bedrock(modelId), prompt: "Hi" });

  // Add to enabled list
  const enabled = await getBedrockEnabledModels(resources);
  if (!enabled.includes(modelId)) {
    enabled.push(modelId);
    await resources.ddb.entities.Setting.build(PutItemCommand)
      .item({
        key: "bedrockEnabledModels",
        value: JSON.stringify(enabled),
      })
      .send();
  }

  return true;
}
