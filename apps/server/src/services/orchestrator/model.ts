import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { LanguageModel } from "ai";

const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

export function getModel(): LanguageModel {
  return bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");
}
