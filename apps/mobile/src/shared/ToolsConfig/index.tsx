import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import type { AgentQuery as AgentQueryType } from "../../graphql/generated/graphql";
import {
  AllEnabledModelsQuery,
  EnabledModelDetailsQuery,
  IntegrationProvidersQuery,
  ProviderModelsQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../graphql/queries";
import { execute } from "../../lib/apolloClient";
import { ModelPicker } from "../ModelPicker";
import { VoicePicker } from "../VoicePicker";
import {
  type PlainConfig,
  getModelLabel,
  resolveModelIds,
  toModelRef,
  toPlainConfig,
} from "./helpers";
import { ModelToolCard } from "./ModelToolCard";
import { SandboxToolCard } from "./SandboxToolCard";
import { WebSearchToolCard } from "./WebSearchToolCard";

export { toPlainConfig, type PlainConfig } from "./helpers";

type Agent = NonNullable<AgentQueryType["agent"]>;

export function ToolsConfig({ agent }: { agent: Agent }) {
  const router = useRouter();
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailableData } = useQuery(ProviderModelsQuery, {
    variables: { providerId: "bedrock" },
  });
  const providers = providersData?.integrationProviders ?? [];
  const allEnabled = enabledData?.allEnabledModels ?? [];
  const bedrockModels = bedrockAvailableData?.providerModels ?? [];
  const defaultModel = providersData?.defaultModel ?? null;
  const defaultImageModel = providersData?.defaultImageModel ?? null;
  const defaultSpeechModel = providersData?.defaultSpeechModel ?? null;
  const webSearchProviders = providers.filter(
    (p) => p.category === "web" && p.hasConnection,
  );

  const [localConfig, setLocalConfig] = useState(() =>
    toPlainConfig(agent.config),
  );
  const [saving, setSaving] = useState(false);
  const [modelPickerMode, setModelPickerMode] = useState<
    "chat" | "image_generation" | "audio_speech" | null
  >(null);
  const [voicePickerVisible, setVoicePickerVisible] = useState(false);
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
  const localConfigRef = useRef(localConfig);
  localConfigRef.current = localConfig;

  const updateConfig = useCallback(
    (patch: Partial<PlainConfig>) => {
      const merged = { ...localConfigRef.current, ...patch };
      setLocalConfig(merged);
      setSaving(true);
      execute(UpdateAgentDoc, {
        id: agent.id,
        input: { config: merged },
      }).finally(() => setSaving(false));
    },
    [agent.id],
  );

  // Resolve effective models (explicit or default)
  const effectiveChatModel = useMemo(
    () => config.model ?? toModelRef(defaultModel),
    [config.model, defaultModel],
  );
  const effectiveImageModel = useMemo(
    () => config.imageModel ?? toModelRef(defaultImageModel),
    [config.imageModel, defaultImageModel],
  );
  const effectiveSpeechModel = useMemo(
    () => config.speechModel ?? toModelRef(defaultSpeechModel),
    [config.speechModel, defaultSpeechModel],
  );

  // Fetch modalities for the selected chat model
  useEffect(() => {
    const ids = resolveModelIds(effectiveChatModel);
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
  }, [effectiveChatModel]);

  // Labels
  const label = (model: PlainConfig["model"]) =>
    getModelLabel(model, providersData, allEnabled, bedrockModels);

  const defaultChatModelRef = toModelRef(defaultModel);
  const defaultImageModelRef = toModelRef(defaultImageModel);
  const defaultSpeechModelRef = toModelRef(defaultSpeechModel);

  const presentModelDetail = (providerId: string, modelId: string) => {
    router.push(
      `/model?provider=${encodeURIComponent(providerId)}&model=${encodeURIComponent(modelId)}`,
    );
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Tools
        </Text>
        {saving && <Text className="text-xs text-text-faint">saving...</Text>}
      </View>

      <ModelToolCard
        config={config}
        updateConfig={updateConfig}
        chatModelLabel={label(effectiveChatModel)}
        imageModelLabel={label(effectiveImageModel)}
        speechModelLabel={label(effectiveSpeechModel)}
        defaultChatModelLabel={defaultChatModelRef ? label(defaultChatModelRef) : null}
        defaultImageModelLabel={defaultImageModelRef ? label(defaultImageModelRef) : null}
        defaultSpeechModelLabel={defaultSpeechModelRef ? label(defaultSpeechModelRef) : null}
        hasDefaultModel={!!defaultModel}
        hasDefaultImageModel={!!defaultImageModel}
        hasDefaultSpeechModel={!!defaultSpeechModel}
        supportsReasoning={modelSupportsReasoning ?? false}
        supportsImages={modelModalities?.includes("image") ?? true}
        onPickModel={setModelPickerMode}
        onPickVoice={() => setVoicePickerVisible(true)}
        onPresentModelDetail={presentModelDetail}
      />

      <SandboxToolCard
        agentId={agent.id}
        config={config}
        updateConfig={updateConfig}
      />

      <WebSearchToolCard
        config={config}
        updateConfig={updateConfig}
        webSearchProviders={webSearchProviders}
      />

      <ModelPicker
        visible={modelPickerMode !== null}
        model={
          modelPickerMode === "chat"
            ? config.model
            : modelPickerMode === "image_generation"
              ? config.imageModel
              : config.speechModel
        }
        providers={providers}
        mode={modelPickerMode ?? undefined}
        onSelect={(value) => {
          if (modelPickerMode === "chat") updateConfig({ model: value });
          else if (modelPickerMode === "image_generation")
            updateConfig({ imageModel: value });
          else updateConfig({ speechModel: value });
        }}
        onSelectDefault={() => {
          if (modelPickerMode === "chat") updateConfig({ model: undefined });
          else if (modelPickerMode === "image_generation")
            updateConfig({ imageModel: undefined });
          else updateConfig({ speechModel: undefined });
        }}
        defaultLabel={
          modelPickerMode === "chat"
            ? defaultChatModelRef
              ? `Use default (${label(defaultChatModelRef)})`
              : "Use default"
            : modelPickerMode === "image_generation"
              ? defaultImageModelRef
                ? `Use default (${label(defaultImageModelRef)})`
                : "Use default"
              : defaultSpeechModelRef
                ? `Use default (${label(defaultSpeechModelRef)})`
                : "Use default"
        }
        isUsingDefault={
          modelPickerMode === "chat"
            ? !config.model
            : modelPickerMode === "image_generation"
              ? !config.imageModel
              : !config.speechModel
        }
        onDismiss={() => setModelPickerMode(null)}
      />

      <VoicePicker
        visible={voicePickerVisible}
        connectionId={
          effectiveSpeechModel?.type === "connection"
            ? effectiveSpeechModel.connectionId
            : undefined
        }
        currentVoice={config.speech?.voice}
        onSelect={(voice) => updateConfig({ speech: { enabled: true, voice } })}
        onDismiss={() => setVoicePickerVisible(false)}
      />
    </View>
  );
}
