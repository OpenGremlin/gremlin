import { useRouter } from "expo-router";
import { Bot, Globe, Info, Terminal } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { AgentQuery as AgentQueryType } from "../../graphql/generated/graphql";
import {
  AllEnabledModelsQuery,
  BedrockAvailableModelsQuery,
  EnabledModelDetailsQuery,
  IntegrationProvidersQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";
import { gql } from "../../lib/auth";
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
  viewImage?: { enabled: boolean };
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
    viewImage: config?.viewImage
      ? { enabled: config.viewImage.enabled }
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
  providers: ProvidersData,
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
  const generateImagesEnabled = !!config.imageModel || !!defaultImageModel;

  const updateConfig = useCallback(
    async (patch: Partial<PlainConfig>) => {
      setLocalConfig((prev) => {
        const merged = { ...prev, ...patch };
        setSaving(true);
        gql(UpdateAgentDoc, {
          id: agent.id,
          input: { config: merged },
        }).finally(() => setSaving(false));
        return merged;
      });
    },
    [agent.id],
  );

  // Resolve model for display — use explicit or fall back to default
  const effectiveChatModel =
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
      : undefined);

  const effectiveImageModel =
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
      : undefined);

  // Fetch modalities for the selected model
  const configModel = effectiveChatModel;
  useEffect(() => {
    const ids = resolveModelIds(configModel);
    if (!ids) {
      setModelModalities(null);
      return;
    }
    let cancelled = false;
    gql(EnabledModelDetailsQuery, { providerId: ids.providerId }).then(
      (result) => {
        if (cancelled) return;
        const detail = result.enabledModelDetails.find(
          (d) => d.id === ids.modelId,
        );
        setModelModalities(detail?.supportedModalities ?? null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [configModel]);

  const supportsImages = modelModalities?.includes("image") ?? true;

  // Auto-disable viewImage when the model does not support images
  useEffect(() => {
    if (!supportsImages && config.viewImage?.enabled) {
      updateConfig({ viewImage: { enabled: false } });
    }
  }, [supportsImages, config.viewImage?.enabled, updateConfig]);

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
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Bot size={18} color={colors.iconDefault} />
          <View className="flex-1">
            <Text className="text-sm font-medium text-text-secondary">
              Models
            </Text>
          </View>
        </View>

        {/* Chat Model */}
        <View className="px-4 pb-3 ml-7 gap-2">
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
              className="flex-1 px-3 py-2.5 bg-surface-alt border border-app-border rounded-lg"
            >
              <Text className="text-sm text-text-secondary">
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
                  const result = await gql(EnabledModelDetailsQuery, {
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

          {/* View Images */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-1">
              <Text className="text-sm text-text-secondary">View Images</Text>
              <Text className="text-xs text-text-muted">
                {!config.sandbox?.enabled
                  ? "Requires Sandbox to be enabled"
                  : !supportsImages
                    ? "Selected model does not support images"
                    : "Let the agent see image files"}
              </Text>
            </View>
            <Toggle
              enabled={
                supportsImages &&
                !!config.sandbox?.enabled &&
                (config.viewImage?.enabled ?? false)
              }
              disabled={!config.sandbox?.enabled || !supportsImages}
              onChange={() => {
                const wasEnabled = config.viewImage?.enabled ?? false;
                updateConfig({ viewImage: { enabled: !wasEnabled } });
              }}
            />
          </View>

          {/* Enable Image Generation Model */}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm text-text-secondary">
              Enable Image Generation Model
            </Text>
            <Toggle
              enabled={generateImagesEnabled}
              onChange={() => {
                if (generateImagesEnabled) {
                  updateConfig({ imageModel: undefined });
                } else if (!defaultImageModel) {
                  setImageModelPickerOpen(true);
                }
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
                  className="flex-1 px-3 py-2.5 bg-surface-alt border border-app-border rounded-lg"
                >
                  <Text className="text-sm text-text-secondary">
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
                      const result = await gql(EnabledModelDetailsQuery, {
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
      </Card>

      {/* Sandbox */}
      <Card className="overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Terminal size={18} color={colors.iconDefault} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-secondary">
                Sandbox
              </Text>
              <Text className="text-xs text-text-muted">
                Bash shell for running commands
              </Text>
            </View>
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
                      commandApproval: config.sandbox?.commandApproval ?? "ask",
                    },
              });
            }}
          />
        </View>
        {config.sandbox?.enabled && (
          <View className="mx-4 mb-3 ml-11 gap-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-text-secondary">
                  Sandbox Always On
                </Text>
                <Text className="text-xs text-text-muted">
                  Don't shut down sandbox after idle time. Sandbox takes about 2
                  minutes to restart.
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
                    mode === "ask" ? "Ask user" : "Dangerously skip approval";
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
          </View>
        )}
      </Card>

      {/* Web Search */}
      <Card className="overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Globe size={18} color={colors.iconDefault} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-secondary">
                Web Search
              </Text>
              <Text className="text-xs text-text-muted">
                {hasWebSearch
                  ? "Search the web for information"
                  : "Connect Brave Search or Tavily to enable"}
              </Text>
            </View>
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
          <View className="mx-4 mb-3 ml-11 gap-1.5">
            {webSearchProviders.map((p) => {
              const selected =
                (config.webSearch?.provider ?? webSearchProviders[0]?.id) ===
                p.id;
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
          <View className="mx-4 mb-3 ml-11">
            <Text className="text-xs text-warning">
              No search provider connected. Add a Brave Search or Tavily API key
              in Connections.
            </Text>
          </View>
        )}
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
