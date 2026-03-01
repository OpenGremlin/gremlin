import { bedrock } from "@ai-sdk/amazon-bedrock";
import type { LanguageModel } from "ai";

export function getModel(): LanguageModel {
  return bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");
}
