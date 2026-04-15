import type { AgentQuery as AgentQueryType } from "../../graphql/generated/graphql";

type Agent = NonNullable<AgentQueryType["agent"]>;

export interface PlainConfig {
  model?: ModelRef;
  imageModel?: ModelRef;
  speechModel?: ModelRef;
  sandbox?: {
    enabled: boolean;
    idleTimeoutMinutes?: number;
    alwaysOn?: boolean;
    commandApproval: string;
  };
  webSearch?: { enabled: boolean; provider?: string };
  reasoning?: { enabled: boolean };
  viewImage?: { enabled: boolean };
  imageGeneration?: { enabled: boolean };
  speech?: { enabled: boolean; voice?: string };
  manager?: { enabled: boolean; team: string[] };
}

export type ModelRef = { type: string; modelId?: string; connectionId?: string };

export function toPlainConfig(config: Agent["config"]): PlainConfig {
  return {
    model: config?.model
      ? {
          type: config.model.type,
          modelId: config.model.modelId ?? undefined,
          connectionId: config.model.connectionId ?? undefined,
        }
      : undefined,
    imageModel: config?.imageModel
      ? {
          type: config.imageModel.type,
          modelId: config.imageModel.modelId ?? undefined,
          connectionId: config.imageModel.connectionId ?? undefined,
        }
      : undefined,
    speechModel: config?.speechModel
      ? {
          type: config.speechModel.type,
          modelId: config.speechModel.modelId ?? undefined,
          connectionId: config.speechModel.connectionId ?? undefined,
        }
      : undefined,
    sandbox: config?.sandbox
      ? {
          enabled: config.sandbox.enabled,
          idleTimeoutMinutes: config.sandbox.idleTimeoutMinutes ?? undefined,
          alwaysOn: config.sandbox.alwaysOn ?? undefined,
          commandApproval: config.sandbox.commandApproval,
        }
      : undefined,
    webSearch: config?.webSearch
      ? {
          enabled: config.webSearch.enabled,
          provider: config.webSearch.provider ?? undefined,
        }
      : undefined,
    reasoning: config?.reasoning
      ? { enabled: config.reasoning.enabled }
      : undefined,
    viewImage: config?.viewImage
      ? { enabled: config.viewImage.enabled }
      : undefined,
    imageGeneration: config?.imageGeneration
      ? { enabled: config.imageGeneration.enabled }
      : undefined,
    speech: config?.speech
      ? {
          enabled: config.speech.enabled,
          voice: config.speech.voice ?? undefined,
        }
      : undefined,
    manager: config?.manager
      ? {
          enabled: config.manager.enabled,
          team: config.manager.team ?? [],
        }
      : undefined,
  };
}

type ProvidersData = {
  integrationProviders: Array<{ id: string; service: string }>;
} | null;

type EnabledEntry = {
  providerId: string;
  modelId: string;
  modelName?: string | null;
};

type BedrockModel = { id: string; name: string };

export function getModelLabel(
  model: ModelRef | undefined,
  providers: ProvidersData | undefined,
  allEnabled: EnabledEntry[],
  bedrockModels: BedrockModel[],
): string {
  if (!model) return "Select a model";
  if (model.type === "bedrock" && model.modelId) {
    const bm = bedrockModels.find((m) => m.id === model.modelId);
    return bm ? `Bedrock / ${bm.name}` : `Bedrock / ${model.modelId}`;
  }
  if (model.type === "connection" && model.connectionId) {
    const [providerId, modelId] = model.connectionId.split(":", 2);
    const provider = providers?.integrationProviders?.find(
      (p) => p.id === providerId,
    );
    const entry = allEnabled.find(
      (e) => e.providerId === providerId && e.modelId === modelId,
    );
    const name = entry?.modelName ?? modelId;
    return `${provider?.service ?? providerId} / ${name}`;
  }
  return "Select a model";
}

export function resolveModelIds(
  model: ModelRef | undefined,
): { providerId: string; modelId: string } | null {
  if (!model) return null;
  if (model.type === "bedrock" && model.modelId) {
    return { providerId: "bedrock", modelId: model.modelId };
  }
  if (model.type === "connection" && model.connectionId) {
    const [providerId, modelId] = model.connectionId.split(":", 2);
    return { providerId, modelId };
  }
  return null;
}

export function toModelRef(
  dm: { providerId: string; modelId: string } | null,
): ModelRef | undefined {
  if (!dm) return undefined;
  const isBedrock = dm.providerId === "bedrock";
  return {
    type: isBedrock ? "bedrock" : "connection",
    modelId: isBedrock ? dm.modelId : undefined,
    connectionId: isBedrock ? undefined : `${dm.providerId}:${dm.modelId}`,
  };
}
