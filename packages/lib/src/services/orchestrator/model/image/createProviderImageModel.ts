import { createFireworks } from "@ai-sdk/fireworks";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createXai } from "@ai-sdk/xai";
import type { ImageModel } from "ai";

export function createProviderImageModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): ImageModel {
  switch (providerId) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai.image(modelId);
    }
    case "google_ai": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google.image(modelId);
    }
    case "xai": {
      const xai = createXai({ apiKey });
      return xai.image(modelId);
    }
    case "together": {
      const together = createTogetherAI({ apiKey });
      return together.image(modelId);
    }
    case "fireworks": {
      const fireworks = createFireworks({ apiKey });
      return fireworks.image(modelId);
    }
    default:
      throw new Error(
        `Image generation not supported for provider: ${providerId}`,
      );
  }
}
