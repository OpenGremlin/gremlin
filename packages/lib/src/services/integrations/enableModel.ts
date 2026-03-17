import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { generateText } from "ai";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { getEnabledModels } from "./getEnabledModels.js";

export async function enableModel(
  resources: Resources,
  providerId: string,
  modelId: string,
): Promise<boolean> {
  // Bedrock uses server-side credentials — test inference to verify access
  if (providerId === "bedrock") {
    const bedrock = createAmazonBedrock({
      credentialProvider: fromNodeProviderChain(),
    });
    await generateText({ model: bedrock(modelId), prompt: "Hi" });
  }

  const enabled = await getEnabledModels(resources, providerId);
  if (!enabled.includes(modelId)) {
    enabled.push(modelId);
    await resources.ddb.entities.Setting.build(PutItemCommand)
      .item({
        key: `enabledModels:${providerId}`,
        value: JSON.stringify(enabled),
      })
      .send();
  }

  return true;
}
