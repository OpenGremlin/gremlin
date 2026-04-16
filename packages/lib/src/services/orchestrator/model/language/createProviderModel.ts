import { createAlibaba } from "@ai-sdk/alibaba";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createFireworks } from "@ai-sdk/fireworks";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import { createMinimax } from "vercel-minimax-ai-provider";

export function createProviderModel(
  providerId: string,
  modelId: string,
  apiKey: string,
): LanguageModel {
  switch (providerId) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
    case "google_ai": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "xai": {
      const xai = createXai({ apiKey });
      return xai(modelId);
    }
    case "mistral": {
      const mistral = createMistral({ apiKey });
      return mistral(modelId);
    }
    case "deepseek": {
      const deepseek = createDeepSeek({ apiKey });
      return deepseek(modelId);
    }
    case "groq": {
      const groq = createGroq({ apiKey });
      return groq(modelId);
    }
    case "perplexity": {
      const perplexity = createPerplexity({ apiKey });
      return perplexity(modelId);
    }
    case "together": {
      const together = createTogetherAI({ apiKey });
      return together(modelId);
    }
    case "fireworks": {
      const fireworks = createFireworks({ apiKey });
      return fireworks(modelId);
    }
    case "cohere": {
      const cohere = createCohere({ apiKey });
      return cohere(modelId);
    }
    case "minimax": {
      const minimax = createMinimax({ apiKey });
      return minimax(modelId);
    }
    case "qwen": {
      const alibaba = createAlibaba({ apiKey });
      return alibaba(modelId);
    }
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}
