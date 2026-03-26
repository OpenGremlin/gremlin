import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AWS SDK before importing the module
const mockSend = vi.fn();
vi.mock("@aws-sdk/client-bedrock", () => {
  return {
    BedrockClient: class {
      send = mockSend;
    },
    ListInferenceProfilesCommand: class {
      constructor(public input: unknown) {}
    },
  };
});
vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(),
}));

// Mock the metadata store to control classification
vi.mock("./modelMetadataStore.js", () => ({
  classifyModelFromStore: vi.fn((_providerId: string, modelId: string) => {
    // Simulate LiteLLM store: classify known models, return null for unknown
    if (
      modelId.includes("embed") ||
      modelId.includes("pegasus") ||
      modelId.includes("marengo")
    )
      return null;
    if (
      modelId.includes("canvas") ||
      modelId.includes("stable-image") ||
      modelId.includes("stable-diffusion")
    )
      return "image_generation" as const;
    if (
      modelId.includes("claude") ||
      modelId.includes("llama") ||
      modelId.includes("nova-pro") ||
      modelId.includes("nova-lite")
    )
      return "chat" as const;
    // Unknown model — not in store
    return null;
  }),
}));

// Must import after mocks
const { listBedrockModels } = await import("./listBedrockModels.js");

// Each test uses a unique base time so the module-level cache never carries over
let baseTime = Date.now();

describe("listBedrockModels", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Jump to a unique time well past any prior cache expiry
    baseTime += 10 * 60 * 1000;
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns active inference profiles classified by the metadata store", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "US Anthropic Claude Sonnet 4.6",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.meta.llama4-scout-17b-instruct-v1:0",
          inferenceProfileName: "US Llama 4 Scout 17B Instruct",
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models).toHaveLength(2);
    expect(models[0].id).toBe("us.anthropic.claude-sonnet-4-6");
    expect(models[0].mode).toBe("chat");
    expect(models[1].id).toBe("us.meta.llama4-scout-17b-instruct-v1:0");
    expect(models[1].mode).toBe("chat");
  });

  it("classifies image models from the metadata store", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "US Anthropic Claude Sonnet 4.6",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.amazon.nova-canvas-v1:0",
          inferenceProfileName: "US Amazon Nova Canvas",
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models).toHaveLength(2);
    expect(models[0].id).toBe("us.amazon.nova-canvas-v1:0");
    expect(models[0].mode).toBe("image_generation");
    expect(models[1].id).toBe("us.anthropic.claude-sonnet-4-6");
    expect(models[1].mode).toBe("chat");
  });

  it("filters out models not found in the metadata store", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "US Anthropic Claude Sonnet 4.6",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.cohere.embed-v4:0",
          inferenceProfileName: "US Cohere Embed v4",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.twelvelabs.pegasus-1-2-v1:0",
          inferenceProfileName: "US Pegasus v1.2",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.twelvelabs.marengo-embed-2-7-v1:0",
          inferenceProfileName: "US TwelveLabs Marengo Embed v2.7",
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("us.anthropic.claude-sonnet-4-6");
  });

  it("skips inactive profiles", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "US Anthropic Claude Sonnet 4.6",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.anthropic.claude-3-opus-20240229-v1:0",
          inferenceProfileName: "US Anthropic Claude 3 Opus",
          status: "DEPRECATED",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("us.anthropic.claude-sonnet-4-6");
  });

  it("paginates through multiple pages", async () => {
    mockSend
      .mockResolvedValueOnce({
        inferenceProfileSummaries: [
          {
            inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
            inferenceProfileName: "US Anthropic Claude Sonnet 4.6",
            status: "ACTIVE",
          },
        ],
        nextToken: "page2",
      })
      .mockResolvedValueOnce({
        inferenceProfileSummaries: [
          {
            inferenceProfileId: "us.meta.llama4-scout-17b-instruct-v1:0",
            inferenceProfileName: "US Llama 4 Scout",
            status: "ACTIVE",
          },
        ],
        nextToken: undefined,
      });

    const models = await listBedrockModels();

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(models).toHaveLength(2);
  });

  it("returns sorted results", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.meta.llama4-scout-17b-instruct-v1:0",
          inferenceProfileName: "Llama 4 Scout",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "Claude Sonnet 4.6",
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models[0].id).toBe("us.anthropic.claude-sonnet-4-6");
    expect(models[1].id).toBe("us.meta.llama4-scout-17b-instruct-v1:0");
  });

  it("skips entries with missing id or name", async () => {
    mockSend.mockResolvedValueOnce({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "Claude Sonnet 4.6",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: undefined,
          inferenceProfileName: "No ID",
          status: "ACTIVE",
        },
        {
          inferenceProfileId: "us.some.model",
          inferenceProfileName: undefined,
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    const models = await listBedrockModels();

    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("us.anthropic.claude-sonnet-4-6");
  });

  it("uses cache within TTL", async () => {
    mockSend.mockResolvedValue({
      inferenceProfileSummaries: [
        {
          inferenceProfileId: "us.anthropic.claude-sonnet-4-6",
          inferenceProfileName: "Claude Sonnet 4.6",
          status: "ACTIVE",
        },
      ],
      nextToken: undefined,
    });

    await listBedrockModels();
    // Advance 1 minute (within 5-min TTL)
    vi.advanceTimersByTime(60 * 1000);
    const models = await listBedrockModels();

    // Should only have called the API once
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(models).toHaveLength(1);
  });
});
