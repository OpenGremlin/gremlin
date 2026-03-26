import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { generateText } from "ai";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { type EnabledModel, getEnabledModels } from "./getEnabledModels.js";
import {
  classifyModelFromStore,
  lookupModelMetadata,
} from "./modelMetadataStore.js";

/**
 * Build an EnabledModel snapshot from the LiteLLM metadata store.
 * Falls back to sensible defaults if the model isn't in the store.
 */
export function snapshotModel(
  providerId: string,
  modelId: string,
  displayName?: string,
): EnabledModel {
  const mode = classifyModelFromStore(providerId, modelId) ?? "chat";
  const meta = lookupModelMetadata(providerId, modelId);
  // Default chat models to ["text"] when the metadata doesn't specify modalities
  const defaultModalities = mode === "chat" ? ["text"] : undefined;
  let modalities = meta?.supported_modalities ?? defaultModalities;
  // Many models set supports_vision but have an empty supported_modalities array;
  // ensure "image" is present so downstream vision checks work correctly.
  if (meta?.supports_vision && modalities && !modalities.includes("image")) {
    modalities = [...modalities, "image"];
  }
  return {
    id: modelId,
    name: displayName ?? modelId,
    mode,
    maxInputTokens: meta?.max_input_tokens,
    inputCostPerToken: meta?.input_cost_per_token,
    outputCostPerToken: meta?.output_cost_per_token,
    supportedModalities: modalities,
    supportedOutputModalities:
      meta?.supported_output_modalities ?? defaultModalities,
    inputCostPerImage: meta?.input_cost_per_image,
    inputCostPerImageToken: meta?.input_cost_per_image_token,
    outputCostPerImage: meta?.output_cost_per_image,
    outputCostPerImageToken: meta?.output_cost_per_image_token,
  };
}

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
    enabled.push(snapshotModel(providerId, modelId, displayName));
    await resources.ddb.entities.EnabledModels.build(PutItemCommand)
      .item({ providerId, models: enabled })
      .send();
  }

  return true;
}
