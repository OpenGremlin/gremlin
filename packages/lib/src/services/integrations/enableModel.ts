import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { generateText } from "ai";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { getEnabledModels } from "./getEnabledModels.js";
import { classifyModelFromStore } from "./modelMetadataStore.js";

export async function enableModel(
  resources: Resources,
  providerId: string,
  modelId: string,
  displayName?: string,
): Promise<boolean> {
  // Bedrock uses server-side credentials — test inference to verify access
  if (providerId === "bedrock") {
    const mode = classifyModelFromStore(providerId, modelId);
    // Only test text models — image models don't support generateText
    if (mode !== "image_generation") {
      const bedrock = createAmazonBedrock({
        credentialProvider: fromNodeProviderChain(),
      });
      await generateText({ model: bedrock(modelId), prompt: "Hi" });
    }
  }

  const enabled = await getEnabledModels(resources, providerId);
  if (!enabled.some((m) => m.id === modelId)) {
    const mode = classifyModelFromStore(providerId, modelId) ?? "chat";
    enabled.push({ id: modelId, name: displayName ?? modelId, mode });
    await resources.ddb.entities.EnabledModels.build(PutItemCommand)
      .item({ providerId, models: enabled })
      .send();
  }

  return true;
}
