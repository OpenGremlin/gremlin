import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { Bot, Globe, Info, Terminal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { AgentQuery as AgentQueryType } from "../../graphql/generated/graphql";
import {
  AllEnabledModelsQuery,
  BedrockAvailableModelsQuery,
  EnabledModelDetailsQuery,
  IntegrationProvidersQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { AllowlistConfig } from "../AllowlistConfig";
import { Card } from "../Card";
import type { ModelDetail } from "../ModelDetailModal";
import { ModelDetailModal } from "../ModelDetailModal";
import { Toggle } from "../Toggle";
import { ModelPicker } from "./ModelPicker";

type Agent = NonNullable<AgentQueryType["agent"]>;

interface PlainConfig {
  model?: { type: string; modelId?: string; connectionId?: string };
  imageModel?: { type: string; modelId?: string; connectionId?: string };
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
  programs?: { enabled: boolean };
}

function toPlainConfig(config: Agent["config"]): PlainConfig {
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
    programs: config?.programs
      ? { enabled: config.programs.enabled }
      : undefined,
  };
}

type ProvidersData = {
  integrationProviders: Array<{
    id: string;
    service: string;
  }>;
} | null;

type EnabledEntry = {
  providerId: string;
  modelId: string;
  modelName?: string | null;
};
type BedrockModel = { id: string; name: string };

function getModelLabel(
  model: PlainConfig["model"],
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

function resolveModelIds(
  model: PlainConfig["model"],
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

export function ToolsConfig({ agent }: { agent: Agent }) {
  const colors = useNavigationTheme();
  const router = useRouter();
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailableData } = useQuery(BedrockAvailableModelsQuery);
  const providers = providersData?.integrationProviders ?? [];
  const allEnabled = enabledData?.allEnabledModels ?? [];
  const bedrockModels = bedrockAvailableData?.bedrockAvailableModels ?? [];
  const defaultModel = providersData?.defaultModel ?? null;
  const defaultImageModel = providersData?.defaultImageModel ?? null;
  const webSearchProviders = providers.filter(
    (p) => p.category === "web" && p.hasConnection,
  );
  const hasWebSearch = webSearchProviders.length > 0;

  const [localConfig, setLocalConfig] = useState(() =>
    toPlainConfig(agent.config),
  );
  const [saving, setSaving] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [imageModelPickerOpen, setImageModelPickerOpen] = useState(false);
  const [modelDetail, setModelDetail] = useState<ModelDetail | null>(null);
  const [modelModalities, setModelModalities] = useState<string[] | null>(null);
  const [modelSupportsReasoning, setModelSupportsReasoning] = useState<
    boolean | null
  >(null);

  // Sync from server when agent prop updates
  const serverConfig = agent.config;
  const [lastServerConfig, setLastServerConfig] = useState(serverConfig);
  if (serverConfig !== lastServerConfig) {
    setLastServerConfig(serverConfig);
    setLocalConfig(toPlainConfig(serverConfig));
  }

  const config = localConfig;

  // Whether using defaults
  const usingDefaultChatModel = !config.model;
  const usingDefaultImageModel = !config.imageModel;
  const generateImagesEnabled = config.imageGeneration?.enabled ?? false;

  const updateConfig = useCallback(
    async (patch: Partial<PlainConfig>) => {
      setLocalConfig((prev) => {
        const merged = { ...prev, ...patch };
        setSaving(true);
        execute(UpdateAgentDoc, {
          id: agent.id,
          input: { config: merged },
        }).finally(() => setSaving(false));
        return merged;
      });
    },
    [agent.id],
  );

  // Resolve model for display — use explicit or fall back to default
  const effectiveChatModel = useMemo(
    () =>
      config.model ??
      (defaultModel
        ? {
            type:
              defaultModel.providerId === "bedrock" ? "bedrock" : "connection",
            modelId:
              defaultModel.providerId === "bedrock"
                ? defaultModel.modelId
                : undefined,
            connectionId:
              defaultModel.providerId !== "bedrock"
                ? `${defaultModel.providerId}:${defaultModel.modelId}`
                : undefined,
          }
        : undefined),
    [config.model, defaultModel],
  );

  const effectiveImageModel = useMemo(
    () =>
      config.imageModel ??
      (defaultImageModel
        ? {
            type:
              defaultImageModel.providerId === "bedrock"
                ? "bedrock"
                : "connection",
            modelId:
              defaultImageModel.providerId === "bedrock"
                ? defaultImageModel.modelId
                : undefined,
            connectionId:
              defaultImageModel.providerId !== "bedrock"
                ? `${defaultImageModel.providerId}:${defaultImageModel.modelId}`
                : undefined,
          }
        : undefined),
    [config.imageModel, defaultImageModel],
  );

  // Fetch modalities for the selected model
  const configModel = effectiveChatModel;
  useEffect(() => {
    const ids = resolveModelIds(configModel);
    if (!ids) {
      setModelModalities(null);
      setModelSupportsReasoning(null);
      return;
    }
    let cancelled = false;
    execute(EnabledModelDetailsQuery, { providerId: ids.providerId }).then(
      (result) => {
        if (cancelled) return;
        const detail = result.enabledModelDetails.find(
          (d) => d.id === ids.modelId,
        );
        setModelModalities(detail?.supportedModalities ?? null);
        setModelSupportsReasoning(detail?.supportsReasoning ?? null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [configModel]);

  const supportsReasoning = modelSupportsReasoning ?? false;
  const supportsImages = modelModalities?.includes("image") ?? true;

  const chatModelLabel = getModelLabel(
    effectiveChatModel,
    providersData,
    allEnabled,
    bedrockModels,
  );

  const imageModelLabel = getModelLabel(
    effectiveImageModel,
    providersData,
    allEnabled,
    bedrockModels,
  );

  const defaultChatModelLabel = defaultModel
    ? getModelLabel(
        {
          type:
            defaultModel.providerId === "bedrock" ? "bedrock" : "connection",
          modelId:
            defaultModel.providerId === "bedrock"
              ? defaultModel.modelId
              : undefined,
          connectionId:
            defaultModel.providerId !== "bedrock"
              ? `${defaultModel.providerId}:${defaultModel.modelId}`
              : undefined,
        },
        providersData,
        allEnabled,
        bedrockModels,
      )
    : null;

  const defaultImageModelLabel = defaultImageModel
    ? getModelLabel(
        {
          type:
            defaultImageModel.providerId === "bedrock"
              ? "bedrock"
              : "connection",
          modelId:
            defaultImageModel.providerId === "bedrock"
              ? defaultImageModel.modelId
              : undefined,
          connectionId:
            defaultImageModel.providerId !== "bedrock"
              ? `${defaultImageModel.providerId}:${defaultImageModel.modelId}`
              : undefined,
        },
        providersData,
        allEnabled,
        bedrockModels,
      )
    : null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Tools
        </Text>
        {saving && <Text className="text-xs text-text-faint">saving...</Text>}
      </View>

      {/* Models */}
      <Card className="overflow-hidden">
        <View className="flex-row px-4 py-3 gap-3">
          <View className="w-[18px] pt-0.5">
            <Bot size={18} color={colors.iconDefault} />
          </View>
          <View className="flex-1 gap-2">
            <Text className="text-base font-bold text-text-secondary">
              Models
            </Text>

            {/* Chat Model */}
            <Text className="text-sm text-text-secondary">Chat Model</Text>
            {!defaultModel && usingDefaultChatModel && (
              <View className="gap-1">
                <Text className="text-xs text-error">
                  No default model configured.
                </Text>
                <Pressable onPress={() => router.push("/settings/models")}>
                  <Text className="text-xs text-accent-primary">
                    Go to Models settings
                  </Text>
                </Pressable>
              </View>
            )}
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setModelPickerOpen(true)}
                className={`flex-1 px-3 py-2.5 rounded-lg border ${!usingDefaultChatModel ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
              >
                <Text
                  className={`text-sm ${!usingDefaultChatModel ? "text-text-primary" : "text-text-secondary"}`}
                >
                  {usingDefaultChatModel
                    ? defaultChatModelLabel
                      ? `Use default (${defaultChatModelLabel})`
                      : "Use default"
                    : chatModelLabel}
                </Text>
              </Pressable>
              {!usingDefaultChatModel && (
                <Pressable
                  onPress={async () => {
                    const ids = resolveModelIds(config.model);
                    if (!ids) return;
                    const result = await execute(EnabledModelDetailsQuery, {
                      providerId: ids.providerId,
                    });
                    const detail = result.enabledModelDetails.find(
                      (d) => d.id === ids.modelId,
                    );
                    if (detail) setModelDetail(detail);
                  }}
                  className="p-2"
                >
                  <Info size={18} color={colors.iconDefault} />
                </Pressable>
              )}
            </View>

            {/* Reasoning */}
            <View className="flex-row items-center justify-between mt-1 gap-3">
              <View className="flex-1">
                <Text className="text-sm text-text-secondary">Reasoning</Text>
                <Text className="text-xs text-text-muted">
                  {!supportsReasoning
                    ? "Selected model does not support reasoning"
                    : "Enable extended thinking for complex tasks"}
                </Text>
              </View>
              <Toggle
                enabled={
                  supportsReasoning && (config.reasoning?.enabled ?? false)
                }
                disabled={!supportsReasoning}
                onChange={() => {
                  const wasEnabled = config.reasoning?.enabled ?? false;
                  updateConfig({ reasoning: { enabled: !wasEnabled } });
                }}
              />
            </View>

            {/* View Images */}
            <View className="flex-row items-center justify-between mt-1 gap-3">
              <View className="flex-1">
                <Text className="text-sm text-text-secondary">View Images</Text>
                <Text className="text-xs text-text-muted">
                  {!supportsImages
                    ? "Selected model does not support images"
                    : "Let the agent see image files"}
                </Text>
              </View>
              <Toggle
                enabled={supportsImages && (config.viewImage?.enabled ?? false)}
                disabled={!supportsImages}
                onChange={() => {
                  const wasEnabled = config.viewImage?.enabled ?? false;
                  updateConfig({ viewImage: { enabled: !wasEnabled } });
                }}
              />
            </View>

            {/* Enable Image Generation Model */}
            <View className="flex-row items-center justify-between mt-1 gap-3">
              <View className="flex-1">
                <Text className="text-sm text-text-secondary">
                  Enable Image Generation Model
                </Text>
              </View>
              <Toggle
                enabled={generateImagesEnabled}
                onChange={() => {
                  updateConfig({
                    imageGeneration: { enabled: !generateImagesEnabled },
                  });
                }}
              />
            </View>
            {generateImagesEnabled && (
              <>
                {!defaultImageModel && usingDefaultImageModel && (
                  <View className="gap-1">
                    <Text className="text-xs text-error">
                      No default image model configured.
                    </Text>
                    <Pressable onPress={() => router.push("/settings/models")}>
                      <Text className="text-xs text-accent-primary">
                        Go to Models settings
                      </Text>
                    </Pressable>
                  </View>
                )}
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setImageModelPickerOpen(true)}
                    className={`flex-1 px-3 py-2.5 rounded-lg border ${!usingDefaultImageModel ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
                  >
                    <Text
                      className={`text-sm ${!usingDefaultImageModel ? "text-text-primary" : "text-text-secondary"}`}
                    >
                      {usingDefaultImageModel
                        ? defaultImageModelLabel
                          ? `Use default (${defaultImageModelLabel})`
                          : "Use default"
                        : imageModelLabel}
                    </Text>
                  </Pressable>
                  {!usingDefaultImageModel && (
                    <Pressable
                      onPress={async () => {
                        const ids = resolveModelIds(config.imageModel);
                        if (!ids) return;
                        const result = await execute(EnabledModelDetailsQuery, {
                          providerId: ids.providerId,
                        });
                        const detail = result.enabledModelDetails.find(
                          (d) => d.id === ids.modelId,
                        );
                        if (detail) setModelDetail(detail);
                      }}
                      className="p-2"
                    >
                      <Info size={18} color={colors.iconDefault} />
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Card>

      {/* Sandbox */}
      <Card className="overflow-hidden">
        <View className="flex-row px-4 py-3 gap-3">
          <View className="w-[18px] pt-0.5">
            <Terminal size={18} color={colors.iconDefault} />
          </View>
          <View className="flex-1 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-bold text-text-secondary">
                  Sandbox
                </Text>
                <Text className="text-xs text-text-muted">
                  Bash shell for running commands
                </Text>
              </View>
              <Toggle
                enabled={config.sandbox?.enabled ?? false}
                onChange={() => {
                  const wasEnabled = config.sandbox?.enabled ?? false;
                  updateConfig({
                    sandbox: wasEnabled
                      ? { enabled: false, commandApproval: "ask" }
                      : {
                          enabled: true,
                          idleTimeoutMinutes:
                            config.sandbox?.idleTimeoutMinutes ?? 20,
                          alwaysOn: config.sandbox?.alwaysOn ?? false,
                          commandApproval:
                            config.sandbox?.commandApproval ?? "ask",
                        },
                  });
                }}
              />
            </View>
            {config.sandbox?.enabled && (
              <View className="gap-3">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-sm text-text-secondary">
                      Sandbox Always On
                    </Text>
                    <Text className="text-xs text-text-muted">
                      Don't shut down sandbox after idle time. Sandbox takes
                      about 2 minutes to restart.
                    </Text>
                  </View>
                  <Toggle
                    enabled={config.sandbox.alwaysOn ?? false}
                    onChange={() => {
                      const sandbox = config.sandbox ?? {
                        enabled: true,
                        commandApproval: "ask",
                      };
                      updateConfig({
                        sandbox: {
                          ...sandbox,
                          alwaysOn: !(sandbox.alwaysOn ?? false),
                        },
                      });
                    }}
                  />
                </View>
                {!config.sandbox.alwaysOn && (
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm text-text-secondary">
                        Idle Shutdown
                      </Text>
                      <Text className="text-sm text-text-muted">
                        {config.sandbox.idleTimeoutMinutes ?? 20} min
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-1.5">
                      {[10, 20, 30, 60, 120].map((mins) => {
                        const sandbox = config.sandbox ?? {
                          enabled: true,
                          commandApproval: "ask",
                        };
                        const selected =
                          (sandbox.idleTimeoutMinutes ?? 20) === mins;
                        return (
                          <Pressable
                            key={mins}
                            onPress={() =>
                              updateConfig({
                                sandbox: {
                                  ...sandbox,
                                  idleTimeoutMinutes: mins,
                                },
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg border ${selected ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
                          >
                            <Text
                              className={`text-xs ${selected ? "text-text-primary" : "text-text-muted"}`}
                            >
                              {mins} min
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm text-text-secondary">
                      Command Approval
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {(["ask", "skip"] as const).map((mode) => {
                      const sandbox = config.sandbox ?? {
                        enabled: true,
                        commandApproval: "ask",
                      };
                      const current = sandbox.commandApproval ?? "ask";
                      const selected = current === mode;
                      const label =
                        mode === "ask"
                          ? "Ask user"
                          : "Dangerously skip approval";
                      return (
                        <Pressable
                          key={mode}
                          onPress={() =>
                            updateConfig({
                              sandbox: { ...sandbox, commandApproval: mode },
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg border ${selected ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
                        >
                          <Text
                            className={`text-xs ${selected ? "text-text-primary" : "text-text-muted"}`}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                {config.sandbox?.commandApproval === "ask" && (
                  <AllowlistConfig agentId={agent.id} />
                )}

                {/* Programs */}
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-sm text-text-secondary">
                      Programs
                    </Text>
                    <Text className="text-xs text-text-muted">
                      Build and run persistent scripts, databases, and
                      automations
                    </Text>
                  </View>
                  <Toggle
                    enabled={config.programs?.enabled ?? true}
                    onChange={() => {
                      const wasEnabled = config.programs?.enabled ?? true;
                      updateConfig({ programs: { enabled: !wasEnabled } });
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Web Search */}
      <Card className="overflow-hidden">
        <View className="flex-row px-4 py-3 gap-3">
          <View className="w-[18px] pt-0.5">
            <Globe size={18} color={colors.iconDefault} />
          </View>
          <View className="flex-1 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-bold text-text-secondary">
                  Web Search
                </Text>
                <Text className="text-xs text-text-muted">
                  {hasWebSearch
                    ? "Search the web for information"
                    : "Connect Brave Search or Tavily to enable"}
                </Text>
              </View>
              <Toggle
                enabled={config.webSearch?.enabled ?? false}
                disabled={!hasWebSearch}
                onChange={() => {
                  if (!hasWebSearch) return;
                  const wasEnabled = config.webSearch?.enabled ?? false;
                  updateConfig({
                    webSearch: {
                      enabled: !wasEnabled,
                      provider:
                        config.webSearch?.provider ??
                        webSearchProviders[0]?.id ??
                        "brave",
                    },
                  });
                }}
              />
            </View>
            {config.webSearch?.enabled && hasWebSearch && (
              <View className="gap-1.5">
                {webSearchProviders.map((p) => {
                  const selected =
                    (config.webSearch?.provider ??
                      webSearchProviders[0]?.id) === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() =>
                        updateConfig({
                          webSearch: { enabled: true, provider: p.id },
                        })
                      }
                      className={`px-3 py-2.5 rounded-lg border ${
                        selected
                          ? "bg-accent-surface border-accent-border"
                          : "bg-surface-alt border-app-border"
                      }`}
                    >
                      <Text
                        className={`text-sm ${selected ? "text-text-primary" : "text-text-muted"}`}
                      >
                        {p.service}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {config.webSearch?.enabled && !hasWebSearch && (
              <Text className="text-xs text-warning">
                No search provider connected. Add a Brave Search or Tavily API
                key in Connections.
              </Text>
            )}
          </View>
        </View>
      </Card>

      {modelPickerOpen && (
        <ModelPicker
          model={config.model}
          providers={providers}
          mode="chat"
          onSelect={(value) => updateConfig({ model: value })}
          onSelectDefault={() => updateConfig({ model: undefined })}
          defaultLabel={
            defaultChatModelLabel
              ? `Use default (${defaultChatModelLabel})`
              : "Use default"
          }
          isUsingDefault={usingDefaultChatModel}
          onClose={() => setModelPickerOpen(false)}
        />
      )}

      {imageModelPickerOpen && (
        <ModelPicker
          model={config.imageModel}
          providers={providers}
          mode="image_generation"
          onSelect={(value) => updateConfig({ imageModel: value })}
          onSelectDefault={() => updateConfig({ imageModel: undefined })}
          defaultLabel={
            defaultImageModelLabel
              ? `Use default (${defaultImageModelLabel})`
              : "Use default"
          }
          isUsingDefault={usingDefaultImageModel}
          onClose={() => setImageModelPickerOpen(false)}
        />
      )}

      <ModelDetailModal
        model={modelDetail}
        onClose={() => setModelDetail(null)}
      />
    </View>
  );
}
