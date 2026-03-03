export interface ModelDef {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  inputCost?: number;
  outputCost?: number;
}

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  models: ModelDef[];
}

export const providerCatalog: ProviderCatalogEntry[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        contextWindow: 200000,
        maxTokens: 32000,
        reasoning: true,
        inputCost: 15,
        outputCost: 75,
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        maxTokens: 16000,
        reasoning: true,
        inputCost: 3,
        outputCost: 15,
      },
      {
        id: "claude-haiku-3-5-20241022",
        name: "Claude Haiku 3.5",
        contextWindow: 200000,
        maxTokens: 8192,
        reasoning: false,
        inputCost: 0.8,
        outputCost: 4,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        contextWindow: 1047576,
        maxTokens: 32768,
        reasoning: false,
        inputCost: 2,
        outputCost: 8,
      },
      {
        id: "o4-mini",
        name: "o4-mini",
        contextWindow: 200000,
        maxTokens: 100000,
        reasoning: true,
        inputCost: 1.1,
        outputCost: 4.4,
      },
      {
        id: "o3",
        name: "o3",
        contextWindow: 200000,
        maxTokens: 100000,
        reasoning: true,
        inputCost: 2,
        outputCost: 8,
      },
    ],
  },
  {
    id: "google",
    name: "Google",
    models: [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        contextWindow: 1048576,
        maxTokens: 65536,
        reasoning: true,
        inputCost: 1.25,
        outputCost: 10,
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        contextWindow: 1048576,
        maxTokens: 65536,
        reasoning: true,
        inputCost: 0.15,
        outputCost: 0.6,
      },
    ],
  },
];
