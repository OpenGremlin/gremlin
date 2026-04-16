import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

export const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

export const BEDROCK_FALLBACK_MODEL = "us.anthropic.claude-sonnet-4-6";
