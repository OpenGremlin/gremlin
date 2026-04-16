import { createOpenAI } from "@ai-sdk/openai";
import type { SpeechModel } from "ai";

export function createProviderSpeechModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): SpeechModel {
  switch (providerId) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai.speech(modelId);
    }
    default:
      throw new Error(
        `Speech generation not supported for provider: ${providerId}`,
      );
  }
}
