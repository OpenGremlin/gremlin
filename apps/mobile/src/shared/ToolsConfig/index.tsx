import { Bot, Globe, Terminal } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { AgentQuery as AgentQueryType } from "../../graphql/generated/graphql";
import {
  BedrockEnabledModelsQuery,
  IntegrationProvidersQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";
import { gql } from "../../lib/auth";
import { Toggle } from "../Toggle";
import { ModelPicker } from "./ModelPicker";

type Agent = NonNullable<AgentQueryType["agent"]>;

interface PlainConfig {
  model?: { type: string; modelId?: string; connectionId?: string };
  sandbox?: {
    enabled: boolean;
    idleTimeoutMinutes?: number;
    alwaysOn?: boolean;
  };
  webSearch?: { enabled: boolean; provider?: string };
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
        }
      : undefined,
    webSearch: config?.webSearch
      ? {
          enabled: config.webSearch.enabled,
          provider: config.webSearch.provider ?? undefined,
        }
      : undefined,
  };
}

type ProvidersData = {
  integrationProviders: Array<{
    id: string;
    service: string;
    models?: Array<{ id: string; name: string }> | null;
  }>;
} | null;

function getModelLabel(
  model: PlainConfig["model"],
  providers: ProvidersData,
  bedrockModels: string[],
): string {
  if (!model) return "Select a model";
  if (model.type === "bedrock" && model.modelId) {
    const bedrockProvider = providers?.integrationProviders?.find(
      (p) => p.id === "bedrock",
    );
    const m = bedrockProvider?.models?.find(
      (m) => m.id === model.modelId && bedrockModels.includes(m.id),
    );
    return m ? `Bedrock / ${m.name}` : `Bedrock / ${model.modelId}`;
  }
  if (model.type === "connection" && model.connectionId) {
    const [providerId, modelId] = model.connectionId.split(":", 2);
    const provider = providers?.integrationProviders?.find(
      (p) => p.id === providerId,
    );
    const m = provider?.models?.find((m) => m.id === modelId);
    return m
      ? `${provider?.service ?? providerId} / ${m.name}`
      : model.connectionId;
  }
  return "Select a model";
}

export function ToolsConfig({ agent }: { agent: Agent }) {
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: bedrockData } = useQuery(BedrockEnabledModelsQuery);
  const providers = providersData?.integrationProviders ?? [];
  const bedrockModels = bedrockData?.bedrockEnabledModels ?? [];
  const webSearchProviders = providers.filter(
    (p) => p.category === "web" && p.hasConnection,
  );
  const hasWebSearch = webSearchProviders.length > 0;

  const [localConfig, setLocalConfig] = useState(() =>
    toPlainConfig(agent.config),
  );
  const [saving, setSaving] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

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

  const modelLabel = getModelLabel(config.model, providersData, bedrockModels);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Tools
        </Text>
        {saving && <Text className="text-xs text-neutral-600">saving...</Text>}
      </View>

      {/* Model */}
      <View className="border border-neutral-800 rounded-xl overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Bot size={18} color="#a3a3a3" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-neutral-200">
                Model
              </Text>
              <Text className="text-xs text-neutral-500">
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
                      modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0",
                    },
              })
            }
          />
        </View>
        {config.model && (
          <Pressable
            onPress={() => setModelPickerOpen(true)}
            className="mx-4 mb-3 ml-11 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg"
          >
            <Text className="text-sm text-neutral-200">{modelLabel}</Text>
          </Pressable>
        )}
      </View>

      {/* Sandbox */}
      <View className="border border-neutral-800 rounded-xl overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Terminal size={18} color="#a3a3a3" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-neutral-200">
                Sandbox
              </Text>
              <Text className="text-xs text-neutral-500">
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
                  ? { enabled: false }
                  : {
                      enabled: true,
                      idleTimeoutMinutes:
                        config.sandbox?.idleTimeoutMinutes ?? 20,
                      alwaysOn: config.sandbox?.alwaysOn ?? false,
                    },
              });
            }}
          />
        </View>
        {config.sandbox?.enabled && (
          <View className="mx-4 mb-3 ml-11 gap-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-neutral-300">Keep running</Text>
                <Text className="text-xs text-neutral-500">
                  Don't shut down after idle timeout
                </Text>
              </View>
              <Toggle
                enabled={config.sandbox.alwaysOn ?? false}
                onChange={() => {
                  const sandbox = config.sandbox ?? { enabled: true };
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
                  <Text className="text-sm text-neutral-300">
                    Idle shutdown
                  </Text>
                  <Text className="text-sm text-neutral-400">
                    {config.sandbox.idleTimeoutMinutes ?? 20} min
                  </Text>
                </View>
                <Text className="text-xs text-neutral-600">
                  10 – 120 minutes
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Web Search */}
      <View className="border border-neutral-800 rounded-xl overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Globe size={18} color="#a3a3a3" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-neutral-200">
                Web Search
              </Text>
              <Text className="text-xs text-neutral-500">
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
                      ? "bg-indigo-600/20 border-indigo-500/40"
                      : "bg-neutral-800 border-neutral-700"
                  }`}
                >
                  <Text
                    className={`text-sm ${selected ? "text-neutral-100" : "text-neutral-400"}`}
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
            <Text className="text-xs text-amber-400">
              No search provider connected. Add a Brave Search or Tavily API key
              in Integrations.
            </Text>
          </View>
        )}
      </View>

      {modelPickerOpen && (
        <ModelPicker
          model={config.model}
          providers={providers}
          bedrockModels={bedrockModels}
          onSelect={(value) => updateConfig({ model: value })}
          onClose={() => setModelPickerOpen(false)}
        />
      )}
    </View>
  );
}
