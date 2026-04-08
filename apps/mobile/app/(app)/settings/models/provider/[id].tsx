import { useQuery } from "@apollo/client";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ConnectApiKeyMutation,
  DisableModelMutation,
  EnabledModelDetailsQuery,
  EnabledModelsQuery,
  EnableModelMutation,
  IntegrationProvidersQuery,
  ProviderModelsQuery,
  SetDefaultImageModelMutation,
  SetDefaultModelMutation,
  SetDefaultSpeechModelMutation,
} from "../../../../../src/graphql/queries";
import { execute } from "../../../../../src/lib/apolloClient";
import { openSheet } from "../../../../../src/lib/sheetStore";
import { useNavigationTheme } from "../../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../../src/shared/Button";
import { Card } from "../../../../../src/shared/Card";
import { Chip } from "../../../../../src/shared/Chip";
import { Input } from "../../../../../src/shared/Input";
import { IntegrationLogo } from "../../../../../src/shared/IntegrationLogo";
import type {
  ModelDetail,
  ModelDetailSheetPayload,
} from "../../../../../src/shared/ModelDetail";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../../src/shared/SearchInput";
import { Toast } from "../../../../../src/shared/Toast";

type DefaultModel = { providerId: string; modelId: string } | null;

type ModelMode = "chat" | "image_generation" | "audio_speech";

const MODEL_MODE_LABELS: Record<ModelMode, string> = {
  chat: "Language Models",
  image_generation: "Image Models",
  audio_speech: "Speech Models",
};

async function setDefaultForType(
  modelMode: ModelMode,
  providerId: string,
  modelId: string,
) {
  const vars = { providerId, modelId };
  if (modelMode === "image_generation")
    return execute(SetDefaultImageModelMutation, vars);
  if (modelMode === "audio_speech")
    return execute(SetDefaultSpeechModelMutation, vars);
  return execute(SetDefaultModelMutation, vars);
}

function TypedModelList({
  providerId,
  modelMode,
  label,
  allModels,
  enabledModelIds,
  modelDetails,
  defaultModel,
  refetchEnabled,
  refetchDetails,
  refetchParent,
  refetchModels,
  onError,
}: {
  providerId: string;
  modelMode: ModelMode;
  label: string;
  allModels: { id: string; name: string; mode: string }[];
  enabledModelIds: string[];
  modelDetails: ModelDetail[];
  defaultModel: DefaultModel;
  refetchEnabled: () => void;
  refetchDetails: () => void;
  refetchParent: () => void;
  refetchModels: () => void;
  onError: (msg: string) => void;
}) {
  const colors = useNavigationTheme();
  const [enablingModel, setEnablingModel] = useState<string | null>(null);
  const [disablingModel, setDisablingModel] = useState<string | null>(null);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [showAvailable, setShowAvailable] = useState(true);
  const [search, setSearch] = useState("");
  const presentModelDetail = (model: ModelDetail) => {
    const sheetId = openSheet<ModelDetailSheetPayload>({ model });
    router.push(`/sheet/model-detail?id=${sheetId}`);
  };

  const modelsOfType = allModels.filter((m) => m.mode === modelMode);
  if (modelsOfType.length === 0) return null;

  const isDefaultProvider = defaultModel?.providerId === providerId;
  const enabledModels = modelsOfType.filter((m) =>
    enabledModelIds.includes(m.id),
  );
  const availableModels = modelsOfType.filter(
    (m) => !enabledModelIds.includes(m.id),
  );

  const query = search.toLowerCase().trim();
  const filteredAvailable = query
    ? availableModels.filter(
        (m) =>
          m.id.toLowerCase().includes(query) ||
          m.name.toLowerCase().includes(query),
      )
    : availableModels;

  async function handleEnable(modelId: string, modelName?: string) {
    setEnablingModel(modelId);
    try {
      await execute(EnableModelMutation, { providerId, modelId, modelName });
      refetchEnabled();
      refetchDetails();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to enable model");
    } finally {
      setEnablingModel(null);
    }
  }

  async function handleDisable(modelId: string) {
    setDisablingModel(modelId);
    try {
      await execute(DisableModelMutation, { providerId, modelId });
      refetchEnabled();
      refetchParent();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to disable model");
    } finally {
      setDisablingModel(null);
    }
  }

  async function handleSetDefault(modelId: string) {
    setSettingModel(modelId);
    try {
      await setDefaultForType(modelMode, providerId, modelId);
      refetchParent();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to set default model",
      );
    } finally {
      setSettingModel(null);
    }
  }

  return (
    <View className="gap-3">
      <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
        {label}
      </Text>

      {enabledModels.length > 0 && (
        <View className="gap-1">
          <Text className="text-sm font-medium text-text-primary mb-1">
            Enabled
          </Text>
          <Card className="overflow-hidden">
            {enabledModels.map((model, i) => {
              const isDefault =
                isDefaultProvider && defaultModel?.modelId === model.id;
              const isDisabling = disablingModel === model.id;
              const isSetting = settingModel === model.id;
              const busy = isDisabling || isSetting;
              const detail = modelDetails.find((d) => d.id === model.id);

              return (
                <Pressable
                  key={model.id}
                  onPress={() => {
                    if (detail) presentModelDetail(detail);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3 active:bg-surface-alt ${i > 0 ? "border-t border-app-border" : ""}`}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm text-text-primary">
                      {model.name}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator
                      color={colors.accentIndicator}
                      size="small"
                    />
                  ) : isDefault ? (
                    <View className="flex-row items-center gap-3">
                      <Chip label="Default" />
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDisable(model.id);
                        }}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-4">
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSetDefault(model.id);
                        }}
                      >
                        <Text className="text-xs font-medium text-accent">
                          Set Default
                        </Text>
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDisable(model.id);
                        }}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Card>
        </View>
      )}

      {availableModels.length > 0 && (
        <View className="gap-2">
          <Pressable
            onPress={() => setShowAvailable((v) => !v)}
            className="flex-row items-center justify-between"
          >
            <Text className="text-sm font-medium text-text-primary">
              Available
              <Text className="text-text-muted font-normal">
                {" "}
                ({availableModels.length})
              </Text>
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable onPress={() => refetchModels()}>
                <Text className="text-xs text-accent">Refresh</Text>
              </Pressable>
              <Text className="text-xs text-text-muted">
                {showAvailable ? "Hide" : "Show"}
              </Text>
            </View>
          </Pressable>

          {showAvailable && (
            <>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search models..."
              />

              <Card className="overflow-hidden">
                {filteredAvailable.map((model, i) => {
                  const isEnabling = enablingModel === model.id;

                  return (
                    <Pressable
                      key={model.id}
                      disabled={isEnabling}
                      onPress={() => handleEnable(model.id, model.name)}
                      className={`flex-row items-center justify-between px-4 py-2.5 active:bg-surface-alt ${i > 0 ? "border-t border-app-border" : ""}`}
                    >
                      <Text className="text-sm text-text-secondary flex-1 mr-3">
                        {model.name}
                      </Text>
                      {isEnabling ? (
                        <ActivityIndicator
                          color={colors.accentIndicator}
                          size="small"
                        />
                      ) : (
                        <Text className="text-xs font-medium text-success">
                          Enable
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </Card>

              {filteredAvailable.length === 0 && query && (
                <Text className="text-sm text-text-muted text-center py-3">
                  No models matching "{search}"
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function ConnectionCard({
  provider,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    connectionType: string;
    hasConnection: boolean;
  };
  refetch: () => void;
}) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (provider.connectionType === "bedrock") {
    return (
      <Card className="p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-text-primary">AWS Credentials</Text>
          <Text className="text-xs text-text-muted mt-0.5">
            Managed server-side
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-green-400" />
          <Text className="text-xs text-text-muted">Connected</Text>
        </View>
      </Card>
    );
  }

  if (provider.hasConnection) {
    return (
      <Card className="p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-text-primary">API Key</Text>
          <Text className="text-xs text-text-muted mt-0.5">Configured</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-green-400" />
          <Text className="text-xs text-text-muted">Active</Text>
        </View>
      </Card>
    );
  }

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await execute(ConnectApiKeyMutation, {
        providerId: provider.id,
        apiKey: apiKeyInput.trim(),
      });
      setApiKeyInput("");
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-text-primary">API Key</Text>
      <Input
        value={apiKeyInput}
        onChangeText={setApiKeyInput}
        placeholder={`Enter your ${provider.service} API key`}
        secureTextEntry
        autoCapitalize="none"
      />
      <Button
        onPress={handleSaveApiKey}
        disabled={!apiKeyInput.trim()}
        loading={saving}
        fullWidth
      >
        Test & Connect
      </Button>
      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ModelLists({
  providerId,
  defaultModel,
  defaultImageModel,
  defaultSpeechModel,
  refetchParent,
  onError,
}: {
  providerId: string;
  defaultModel: DefaultModel;
  defaultImageModel: DefaultModel;
  defaultSpeechModel: DefaultModel;
  refetchParent: () => void;
  onError: (msg: string) => void;
}) {
  const colors = useNavigationTheme();
  const {
    data: modelsData,
    loading: modelsLoading,
    refetch: refetchModels,
  } = useQuery(ProviderModelsQuery, { variables: { providerId } });
  const { data: enabledData, refetch: refetchEnabled } = useQuery(
    EnabledModelsQuery,
    { variables: { providerId } },
  );
  const { data: detailsData, refetch: refetchDetails } = useQuery(
    EnabledModelDetailsQuery,
    { variables: { providerId } },
  );

  const allModels = modelsData?.providerModels ?? [];
  const enabledModelIds = enabledData?.enabledModels ?? [];
  const modelDetails = detailsData?.enabledModelDetails ?? [];

  const defaultsByMode: Record<ModelMode, DefaultModel> = {
    chat: defaultModel,
    image_generation: defaultImageModel,
    audio_speech: defaultSpeechModel,
  };

  if (modelsLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={colors.accentIndicator} size="small" />
        <Text className="text-xs text-text-muted mt-2">Fetching models...</Text>
      </View>
    );
  }

  const modes = (["chat", "image_generation", "audio_speech"] as const).filter(
    (m) => allModels.some((model) => model.mode === m),
  );

  return (
    <>
      {modes.map((m) => (
        <TypedModelList
          key={m}
          providerId={providerId}
          modelMode={m}
          label={MODEL_MODE_LABELS[m]}
          allModels={allModels}
          enabledModelIds={enabledModelIds}
          modelDetails={modelDetails}
          defaultModel={defaultsByMode[m]}
          refetchEnabled={refetchEnabled}
          refetchDetails={refetchDetails}
          refetchParent={refetchParent}
          refetchModels={refetchModels}
          onError={onError}
        />
      ))}
    </>
  );
}

export default function ModelProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(IntegrationProvidersQuery);
  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;
  const defaultModel = data?.defaultModel ?? null;
  const defaultImageModel = data?.defaultImageModel ?? null;
  const defaultSpeechModel = data?.defaultSpeechModel ?? null;
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const handleError = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on screen focus only
    useCallback(() => {
      refetch();
    }, []),
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!provider) {
    return <NotFound label="Provider not found." />;
  }

  return (
    <View className="flex-1">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-4">
          <IntegrationLogo id={provider.id} size={48} />
          <View className="flex-1">
            <Text className="text-xl font-semibold text-text-primary">
              {provider.service}
            </Text>
            <Text className="text-sm text-text-muted mt-0.5">
              {provider.description}
            </Text>
          </View>
        </View>

        <ConnectionCard provider={provider} refetch={refetch} />

        {(provider.connectionType === "bedrock" || provider.hasConnection) && (
          <ModelLists
            providerId={provider.id}
            defaultModel={defaultModel}
            defaultImageModel={defaultImageModel}
            defaultSpeechModel={defaultSpeechModel}
            refetchParent={refetch}
            onError={handleError}
          />
        )}
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        variant="error"
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
}
