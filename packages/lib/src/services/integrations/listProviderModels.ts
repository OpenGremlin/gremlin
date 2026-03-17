export interface ProviderModel {
  id: string;
  name: string;
}

interface ProviderConfig {
  url: string;
  headers: (apiKey: string) => Record<string, string>;
  parse: (body: unknown) => ProviderModel[];
}

/** Models we don't surface (embeddings, tts, image, moderation, etc.) */
const OPENAI_SKIP =
  /^(text-embedding|dall-e|tts-|whisper|babbage|davinci|gpt-3\.5|chatgpt|o1-pro)/;

/** Parse the standard OpenAI-compatible { data: [{ id }] } format */
function parseOpenAIModels(body: unknown): ProviderModel[] {
  const data = (body as { data?: { id: string }[] }).data;
  if (!Array.isArray(data)) return [];
  return data
    .map((m) => ({ id: m.id, name: m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

const providerConfigs: Record<string, ProviderConfig> = {
  anthropic: {
    url: "https://api.anthropic.com/v1/models?limit=100",
    headers: (apiKey) => ({
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    parse: (body) => {
      const data = (body as { data?: { id: string; display_name?: string }[] })
        .data;
      if (!Array.isArray(data)) return [];
      return data.map((m) => ({ id: m.id, name: m.display_name ?? m.id }));
    },
  },
  openai: {
    url: "https://api.openai.com/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: (body) => {
      const data = (body as { data?: { id: string; owned_by?: string }[] })
        .data;
      if (!Array.isArray(data)) return [];
      return data
        .filter((m) => !OPENAI_SKIP.test(m.id))
        .map((m) => ({ id: m.id, name: m.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  },
  google_ai: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    headers: () => ({}),
    parse: (body) => {
      const models = (
        body as {
          models?: {
            name: string;
            displayName?: string;
            supportedGenerationMethods?: string[];
          }[];
        }
      ).models;
      if (!Array.isArray(models)) return [];
      return models
        .filter((m) =>
          m.supportedGenerationMethods?.includes("generateContent"),
        )
        .map((m) => ({
          id: m.name.replace(/^models\//, ""),
          name: m.displayName ?? m.name,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  },
  xai: {
    url: "https://api.x.ai/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  mistral: {
    url: "https://api.mistral.ai/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  deepseek: {
    url: "https://api.deepseek.com/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  groq: {
    url: "https://api.groq.com/openai/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  perplexity: {
    url: "https://api.perplexity.ai/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  together: {
    url: "https://api.together.xyz/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: (body) => {
      const data = (body as { data?: { id: string; display_name?: string }[] })
        .data;
      // Together may return array directly or wrapped in { data: [...] }
      const models = Array.isArray(data)
        ? data
        : Array.isArray(body)
          ? (body as { id: string; display_name?: string }[])
          : [];
      return models
        .filter((m) => m.id)
        .map((m) => ({ id: m.id, name: m.display_name ?? m.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  },
  fireworks: {
    url: "https://api.fireworks.ai/inference/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: parseOpenAIModels,
  },
  cohere: {
    url: "https://api.cohere.com/v2/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parse: (body) => {
      const models = (
        body as { models?: { name: string; endpoints?: string[] }[] }
      ).models;
      if (!Array.isArray(models)) return [];
      return models
        .filter((m) => m.endpoints?.includes("chat"))
        .map((m) => ({ id: m.name, name: m.name }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  },
};

/**
 * Fetch available models from a provider's API.
 * Throws if the API key is invalid or the request fails.
 */
export async function listProviderModels(
  providerId: string,
  apiKey: string,
): Promise<ProviderModel[]> {
  const config = providerConfigs[providerId];
  if (!config) {
    throw new Error(`No model listing support for provider: ${providerId}`);
  }

  // Google AI uses query param auth
  const url =
    providerId === "google_ai"
      ? `${config.url}?key=${encodeURIComponent(apiKey)}`
      : config.url;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...config.headers(apiKey),
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Invalid API key");
    }
    const text = await res.text().catch(() => "");
    throw new Error(
      `Provider API returned ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const body = await res.json();
  return config.parse(body);
}
