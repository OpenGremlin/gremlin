import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import {
  BedrockAvailableModelsQuery,
  ConnectApiKeyMutation,
  DisableModelMutation,
  EnabledModelDetailsQuery,
  EnabledModelsQuery,
  EnableModelMutation,
  IntegrationProvidersQuery,
  ProviderModelsQuery,
  SetDefaultImageModelMutation,
  SetDefaultModelMutation,
} from "../../../../../src/graphql/queries";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { gql } from "../../../../../src/lib/auth";
import {
  connectOAuthProvider,
  isOAuthAvailable,
  type OAuthProviderConfig,
} from "../../../../../src/lib/oauth";
import { useNavigationTheme } from "../../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../../src/shared/Button";
import { Card } from "../../../../../src/shared/Card";
import { Input } from "../../../../../src/shared/Input";
import { IntegrationLogo } from "../../../../../src/shared/IntegrationLogo";
import type { ModelDetail } from "../../../../../src/shared/ModelDetailModal";
import { ModelDetailModal } from "../../../../../src/shared/ModelDetailModal";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../../src/shared/SearchInput";

type DefaultModel = { providerId: string; modelId: string } | null;

type ModelMode = "chat" | "image_generation";

const MODEL_MODE_LABELS: Record<ModelMode, string> = {
  chat: "Language Models",
  image_generation: "Image Models",
};

async function setDefaultForType(
  modelMode: ModelMode,
  providerId: string,
  modelId: string,
) {
  const vars = { providerId, modelId };
  if (modelMode === "image_generation")
    return gql(SetDefaultImageModelMutation, vars);
  return gql(SetDefaultModelMutation, vars);
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
}) {
  const colors = useNavigationTheme();
  const [enablingModel, setEnablingModel] = useState<string | null>(null);
  const [disablingModel, setDisablingModel] = useState<string | null>(null);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAvailable, setShowAvailable] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);

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
    setError(null);
    try {
      await gql(EnableModelMutation, { providerId, modelId, modelName });
      refetchEnabled();
      refetchDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable model");
    } finally {
      setEnablingModel(null);
    }
  }

  async function handleDisable(modelId: string) {
    setDisablingModel(modelId);
    setError(null);
    try {
      await gql(DisableModelMutation, { providerId, modelId });
      refetchEnabled();
      refetchParent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable model");
    } finally {
      setDisablingModel(null);
    }
  }

  async function handleSetDefault(modelId: string) {
    setSettingModel(modelId);
    setError(null);
    try {
      await setDefaultForType(modelMode, providerId, modelId);
      refetchParent();
    } catch (err) {
      setError(
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

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      {/* ── Enabled Models ── */}
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
                    if (detail) setSelectedModel(detail);
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
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-2 h-2 rounded-full bg-accent" />
                        <Text className="text-xs text-accent">Default</Text>
                      </View>
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

      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />

      {/* ── Available Models ── */}
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

function ApiKeyModelLists({
  providerId,
  defaultModel,
  defaultImageModel,
  refetchParent,
}: {
  providerId: string;
  defaultModel: DefaultModel;
  defaultImageModel: DefaultModel;
  refetchParent: () => void;
}) {
  const colors = useNavigationTheme();
  const {
    data: modelsData,
    loading: modelsLoading,
    refetch: refetchModels,
  } = useQuery(ProviderModelsQuery, { providerId });
  const { data: enabledData, refetch: refetchEnabled } = useQuery(
    EnabledModelsQuery,
    { providerId },
  );
  const { data: detailsData, refetch: refetchDetails } = useQuery(
    EnabledModelDetailsQuery,
    { providerId },
  );

  const allModels = modelsData?.providerModels ?? [];
  const enabledModelIds = enabledData?.enabledModels ?? [];
  const modelDetails = detailsData?.enabledModelDetails ?? [];

  const defaultsByMode: Record<ModelMode, DefaultModel> = {
    chat: defaultModel,
    image_generation: defaultImageModel,
  };

  if (modelsLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={colors.accentIndicator} size="small" />
        <Text className="text-xs text-text-muted mt-2">Fetching models...</Text>
      </View>
    );
  }

  // Determine which model modes this provider has
  const modes = (["chat", "image_generation"] as const).filter((m) =>
    allModels.some((model) => model.mode === m),
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
        />
      ))}
    </>
  );
}

function ApiKeyDetailView({
  provider,
  defaultModel,
  defaultImageModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    description: string;
    hasConnection: boolean;
  };
  defaultModel: DefaultModel;
  defaultImageModel: DefaultModel;
  refetch: () => void;
}) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await gql(ConnectApiKeyMutation, {
        providerId: provider.id,
        apiKey: apiKeyInput.trim(),
      });
      setApiKeyInput("");
      router.navigate(
        `/settings/connections?connected=${encodeURIComponent(provider.id)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {!provider.hasConnection ? (
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
        </View>
      ) : (
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
      )}

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      {provider.hasConnection && (
        <ApiKeyModelLists
          providerId={provider.id}
          defaultModel={defaultModel}
          defaultImageModel={defaultImageModel}
          refetchParent={refetch}
        />
      )}
    </>
  );
}

function BedrockDetailView({
  provider,
  defaultModel,
  defaultImageModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
  };
  defaultModel: DefaultModel;
  defaultImageModel: DefaultModel;
  refetch: () => void;
}) {
  const colors = useNavigationTheme();
  const {
    data: availableData,
    loading: modelsLoading,
    refetch: refetchModels,
  } = useQuery(BedrockAvailableModelsQuery);
  const { data: enabledData, refetch: refetchEnabled } = useQuery(
    EnabledModelsQuery,
    { providerId: provider.id },
  );
  const { data: detailsData, refetch: refetchDetails } = useQuery(
    EnabledModelDetailsQuery,
    { providerId: provider.id },
  );

  const allModels = (availableData?.bedrockAvailableModels ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    mode: m.mode,
  }));
  const enabledModelIds = enabledData?.enabledModels ?? [];
  const modelDetails = detailsData?.enabledModelDetails ?? [];

  const defaultsByMode: Record<ModelMode, DefaultModel> = {
    chat: defaultModel,
    image_generation: defaultImageModel,
  };

  const modes = (["chat", "image_generation"] as const).filter((m) =>
    allModels.some((model) => model.mode === m),
  );

  return (
    <>
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

      {modelsLoading && (
        <View className="py-4 items-center">
          <ActivityIndicator color={colors.accentIndicator} size="small" />
          <Text className="text-xs text-text-muted mt-2">
            Fetching models...
          </Text>
        </View>
      )}

      {modes.map((m) => (
        <TypedModelList
          key={m}
          providerId={provider.id}
          modelMode={m}
          label={MODEL_MODE_LABELS[m]}
          allModels={allModels}
          enabledModelIds={enabledModelIds}
          modelDetails={modelDetails}
          defaultModel={defaultsByMode[m]}
          refetchEnabled={refetchEnabled}
          refetchDetails={refetchDetails}
          refetchParent={refetch}
          refetchModels={refetchModels}
        />
      ))}
    </>
  );
}

function OAuthDetailView({
  provider,
}: {
  provider: OAuthProviderConfig & {
    service: string;
    hasConnection: boolean;
    availableScopes: ReadonlyArray<{ scope: string; label: string }>;
  };
}) {
  const colors = useNavigationTheme();
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(provider.availableScopes.map((s) => s.scope)),
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function handleConnect() {
    if (selectedScopes.size === 0) {
      setError("Select at least one scope.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await connectOAuthProvider(provider, [...selectedScopes]);
      router.navigate(
        `/settings/connections?connected=${encodeURIComponent(provider.id)}`,
      );
    } catch (err) {
      if (err instanceof Error && err.message === "OAuth flow was cancelled") {
        // User dismissed the browser — not an error
      } else {
        setError(err instanceof Error ? err.message : "Connection failed");
      }
    } finally {
      setConnecting(false);
    }
  }

  if (!isOAuthAvailable()) {
    return (
      <Card className="p-5">
        <Text className="text-sm text-text-muted">
          OAuth connections are only available on iOS and Android.
        </Text>
      </Card>
    );
  }

  if (!provider.defaultClientId) {
    return (
      <Card className="p-5">
        <Text className="text-sm text-text-muted">
          No OAuth client configured for this provider. Contact your server
          admin to set one up.
        </Text>
      </Card>
    );
  }

  return (
    <>
      {provider.hasConnection && (
        <Card className="p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-text-primary">
              {provider.service}
            </Text>
            <Text className="text-xs text-text-muted mt-0.5">Connected</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-xs text-text-muted">Active</Text>
          </View>
        </Card>
      )}

      {provider.availableScopes.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-text-primary">Scopes</Text>
          {provider.availableScopes.map((s) => (
            <Pressable
              key={s.scope}
              onPress={() => toggleScope(s.scope)}
              disabled={connecting}
              className="flex-row items-center gap-3 bg-surface border border-app-border rounded-xl px-4 py-3 active:bg-surface-alt"
            >
              <Switch
                value={selectedScopes.has(s.scope)}
                onValueChange={() => toggleScope(s.scope)}
                disabled={connecting}
                trackColor={{
                  false: colors.border,
                  true: colors.accent,
                }}
              />
              <View className="flex-1">
                <Text className="text-sm text-text-primary">{s.label}</Text>
                <Text className="text-xs text-text-muted">{s.scope}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      <Button
        onPress={handleConnect}
        disabled={connecting}
        loading={connecting}
        fullWidth
      >
        {provider.hasConnection ? "Add Connection" : "Connect"}
      </Button>
    </>
  );
}

export default function IntegrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(IntegrationProvidersQuery);
  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;
  const defaultModel = data?.defaultModel ?? null;
  const defaultImageModel = data?.defaultImageModel ?? null;
  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!provider) {
    return <NotFound label="Integration not found." />;
  }

  return (
    <ScrollView
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

      {provider.connectionType === "bedrock" ? (
        <BedrockDetailView
          provider={provider}
          defaultModel={defaultModel ?? null}
          defaultImageModel={defaultImageModel ?? null}
          refetch={refetch}
        />
      ) : provider.connectionType === "apikey" ? (
        <ApiKeyDetailView
          provider={provider}
          defaultModel={defaultModel ?? null}
          defaultImageModel={defaultImageModel ?? null}
          refetch={refetch}
        />
      ) : provider.connectionType === "custom" ? (
        <Card className="p-5">
          <Text className="text-sm text-text-muted">
            This integration requires a custom connection flow that is not yet
            supported.
          </Text>
        </Card>
      ) : provider.connectionType === "oauth" ? (
        <OAuthDetailView provider={provider} />
      ) : (
        <Card className="p-5">
          <Text className="text-sm text-text-muted">
            This connection type is not yet supported.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}
