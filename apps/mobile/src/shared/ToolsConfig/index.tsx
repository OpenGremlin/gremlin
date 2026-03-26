import { Bot, Eye, Globe, Info, Terminal } from "lucide-react-native";
import { useState } from "react";
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

export function ToolsConfig({ agent }: { agent: Agent }) {
  const colors = useNavigationTheme();
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailableData } = useQuery(BedrockAvailableModelsQuery);
  const providers = providersData?.integrationProviders ?? [];
  const allEnabled = enabledData?.allEnabledModels ?? [];
  const bedrockModels = bedrockAvailableData?.bedrockAvailableModels ?? [];
  const webSearchProviders = providers.filter(
    (p) => p.category === "web" && p.hasConnection,
  );
  const hasWebSearch = webSearchProviders.length > 0;

  const [localConfig, setLocalConfig] = useState(() =>
    toPlainConfig(agent.config),
  );
  const [saving, setSaving] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelDetail, setModelDetail] = useState<ModelDetail | null>(null);

  // Sync from server when agent prop updates
  const serverConfig = agent.config;
  const [lastServerConfig, setLastServerConfig] = useState(serverConfig);
  if (serverConfig !== lastServerConfig) {
    setLastServerConfig(serverConfig);
    setLocalConfig(toPlainConfig(serverConfig));
  }

  const config = localConfig;

  async function updateConfig(patch: Partial<typeof config>) {
    const merged = { ...config, ...patch };
    setLocalConfig(merged);
    setSaving(true);
    try {
      await gql(UpdateAgentDoc, {
        id: agent.id,
        input: { config: merged },
      });
    } finally {
      setSaving(false);
    }
  }

  const modelLabel = getModelLabel(
    config.model,
    providersData,
    allEnabled,
    bedrockModels,
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Tools
        </Text>
        {saving && <Text className="text-xs text-text-faint">saving...</Text>}
      </View>

      {/* Model */}
      <Card className="overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Bot size={18} color={colors.iconDefault} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-secondary">
                Model
              </Text>
              <Text className="text-xs text-text-muted">
                LLM provider for inference
              </Text>
            </View>
          </View>
          <Toggle
            enabled={!!config.model}
            onChange={() =>
              updateConfig({
                model: config.model
                  ? undefined
                  : {
                      type: "bedrock",
                      modelId: "us.anthropic.claude-sonnet-4-6",
                    },
              })
            }
          />
        </View>
        {config.model && (
          <View className="mx-4 mb-3 ml-11 flex-row items-center gap-2">
            <Pressable
              onPress={() => setModelPickerOpen(true)}
              className="flex-1 px-3 py-2.5 bg-surface-alt border border-app-border rounded-lg"
            >
              <Text className="text-sm text-text-secondary">{modelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const m = config.model;
                if (!m) return;
                let providerId: string;
                let modelId: string;
                if (m.type === "bedrock" && m.modelId) {
                  providerId = "bedrock";
                  modelId = m.modelId;
                } else if (m.type === "connection" && m.connectionId) {
                  [providerId, modelId] = m.connectionId.split(":", 2);
                } else {
                  return;
                }
                const result = await gql(EnabledModelDetailsQuery, {
                  providerId,
                });
                const detail = result.enabledModelDetails.find(
                  (d) => d.id === modelId,
                );
                if (detail) setModelDetail(detail);
              }}
              className="p-2"
            >
              <Info size={18} color={colors.iconDefault} />
            </Pressable>
          </View>
        )}
      </Card>

      {/* View Images */}
      <Card className="overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Eye size={18} color={colors.iconDefault} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-secondary">
                View Images
              </Text>
              <Text className="text-xs text-text-muted">
                {config.sandbox?.enabled
                  ? "Let the agent see image files"
                  : "Requires Sandbox to be enabled"}
              </Text>
            </View>
          </View>
          <Toggle
            enabled={config.viewImage?.enabled ?? false}
            disabled={!config.sandbox?.enabled}
            onChange={() => {
              const wasEnabled = config.viewImage?.enabled ?? false;
              updateConfig({ viewImage: { enabled: !wasEnabled } });
            }}
          />
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
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-text-secondary">
                  Command approval
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
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-text-secondary">
                  Keep running
                </Text>
                <Text className="text-xs text-text-muted">
                  Don't shut down after idle timeout
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
                    Idle shutdown
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
          onSelect={(value) => updateConfig({ model: value })}
          onClose={() => setModelPickerOpen(false)}
        />
      )}

      <ModelDetailModal
        model={modelDetail}
        onClose={() => setModelDetail(null)}
      />
    </View>
  );
}
