import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BedrockEnabledModelsQuery,
  ConnectApiKeyMutation,
  DisableBedrockModelMutation,
  EnableBedrockModelMutation,
  IntegrationProvidersQuery,
  SetDefaultModelMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import {
  connectOAuthProvider,
  getOAuthDefaults,
  isOAuthAvailable,
} from "../../../../src/lib/oauth";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../src/shared/Button";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

type ProviderModel = {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  inputCost?: number | null;
  outputCost?: number | null;
};

type DefaultModel = { providerId: string; modelId: string } | null;

function ModelCard({
  model,
  isDefault,
  children,
}: {
  model: ProviderModel;
  isDefault: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View
      className={`bg-surface rounded-xl p-4 ${isDefault ? "border border-accent-border" : ""}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-text-primary flex-1">
          {model.name}
        </Text>
        {isDefault && (
          <View className="flex-row items-center gap-1.5 ml-2">
            <View className="w-2 h-2 rounded-full bg-accent" />
            <Text className="text-xs text-accent">Default</Text>
          </View>
        )}
      </View>
      {children ? (
        <View className="mt-3 flex-row gap-3">{children}</View>
      ) : null}
    </View>
  );
}

function ApiKeyDetailView({
  provider,
  defaultModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    description: string;
    hasConnection: boolean;
    models?: ReadonlyArray<ProviderModel> | null;
  };
  defaultModel: DefaultModel;
  refetch: () => void;
}) {
  const colors = useNavigationTheme();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary";

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
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectModel(modelId: string) {
    setSettingModel(modelId);
    setError(null);
    try {
      await gql(SetDefaultModelMutation, {
        providerId: provider.id,
        modelId,
      });
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set default model",
      );
    } finally {
      setSettingModel(null);
    }
  }

  const isDefaultProvider = defaultModel?.providerId === provider.id;
  const models = provider.models ?? [];

  return (
    <>
      {!provider.hasConnection ? (
        <View className="gap-3">
          <Text className="text-sm font-medium text-text-primary">API Key</Text>
          <TextInput
            className={inputClass}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder={`Enter your ${provider.service} API key`}
            placeholderTextColor={colors.placeholderText}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            onPress={handleSaveApiKey}
            disabled={!apiKeyInput.trim()}
            loading={saving}
          >
            Connect
          </Button>
        </View>
      ) : (
        <View className="bg-surface border border-app-border rounded-xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-text-primary">API Key</Text>
            <Text className="text-xs text-text-muted mt-0.5">Configured</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-xs text-text-muted">Active</Text>
          </View>
        </View>
      )}

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      {models.length > 0 && (
        <View className="gap-3">
          <Text className="text-sm font-medium text-text-primary">Models</Text>
          {models.map((model) => {
            const isDefault =
              isDefaultProvider && defaultModel?.modelId === model.id;

            return (
              <ModelCard key={model.id} model={model} isDefault={isDefault}>
                {settingModel === model.id ? (
                  <ActivityIndicator
                    color={colors.accentIndicator}
                    size="small"
                  />
                ) : isDefault ? null : !provider.hasConnection ? (
                  <Text className="text-xs text-text-faint">Add key first</Text>
                ) : (
                  <Pressable onPress={() => handleSelectModel(model.id)}>
                    <Text className="text-xs font-medium text-accent">
                      Set as Default
                    </Text>
                  </Pressable>
                )}
              </ModelCard>
            );
          })}
        </View>
      )}
    </>
  );
}

function BedrockDetailView({
  provider,
  defaultModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    models?: ReadonlyArray<ProviderModel> | null;
  };
  defaultModel: DefaultModel;
  refetch: () => void;
}) {
  const colors = useNavigationTheme();
  const { data: enabledData, refetch: refetchEnabled } = useQuery(
    BedrockEnabledModelsQuery,
  );
  const [enablingModel, setEnablingModel] = useState<string | null>(null);
  const [disablingModel, setDisablingModel] = useState<string | null>(null);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabledModels = enabledData?.bedrockEnabledModels ?? [];
  const isDefaultProvider = defaultModel?.providerId === provider.id;
  const models = provider.models ?? [];

  async function handleEnable(modelId: string) {
    setEnablingModel(modelId);
    setError(null);
    try {
      await gql(EnableBedrockModelMutation, { modelId });
      refetchEnabled();
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
      await gql(DisableBedrockModelMutation, { modelId });
      refetchEnabled();
      refetch();
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
      await gql(SetDefaultModelMutation, {
        providerId: provider.id,
        modelId,
      });
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set default model",
      );
    } finally {
      setSettingModel(null);
    }
  }

  return (
    <>
      <View className="bg-surface border border-app-border rounded-xl p-4 flex-row items-center justify-between">
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
      </View>

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      {models.length > 0 && (
        <View className="gap-3">
          <Text className="text-sm font-medium text-text-primary">Models</Text>
          {models.map((model) => {
            const isEnabled = enabledModels.includes(model.id);
            const isDefault =
              isDefaultProvider && defaultModel?.modelId === model.id;
            const isEnabling = enablingModel === model.id;
            const isDisabling = disablingModel === model.id;
            const isSetting = settingModel === model.id;

            return (
              <ModelCard key={model.id} model={model} isDefault={isDefault}>
                {isEnabling || isDisabling || isSetting ? (
                  <ActivityIndicator
                    color={colors.accentIndicator}
                    size="small"
                  />
                ) : isDefault ? null : isEnabled ? (
                  <>
                    <Pressable onPress={() => handleSetDefault(model.id)}>
                      <Text className="text-xs font-medium text-accent">
                        Set Default
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleDisable(model.id)}>
                      <Text className="text-xs font-medium text-error">
                        Disable
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => handleEnable(model.id)}>
                    <Text className="text-xs font-medium text-success">
                      Enable
                    </Text>
                  </Pressable>
                )}
              </ModelCard>
            );
          })}
        </View>
      )}
    </>
  );
}

function OAuthDetailView({
  provider,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    hasConnection: boolean;
    availableScopes: ReadonlyArray<{ scope: string; label: string }>;
  };
  refetch: () => void;
}) {
  const colors = useNavigationTheme();
  const defaults = getOAuthDefaults(provider.id);
  const hasDefaults = !!defaults.clientId;
  const [useDefaults, setUseDefaults] = useState(hasDefaults);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(provider.availableScopes.map((s) => s.scope)),
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveClientId = useDefaults ? defaults.clientId : clientId;
  const effectiveClientSecret = useDefaults
    ? defaults.clientSecret
    : clientSecret;

  const inputClass =
    "bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary";

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function handleConnect() {
    if (!effectiveClientId || !effectiveClientSecret) {
      setError("Client ID and Client Secret are required.");
      return;
    }
    if (selectedScopes.size === 0) {
      setError("Select at least one scope.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await connectOAuthProvider(
        provider.id,
        effectiveClientId,
        effectiveClientSecret,
        [...selectedScopes],
      );
      refetch();
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
      <View className="bg-surface border border-app-border rounded-xl p-5">
        <Text className="text-sm text-text-muted">
          OAuth connections are only available on iOS and Android.
        </Text>
      </View>
    );
  }

  return (
    <>
      {provider.hasConnection && (
        <View className="bg-surface border border-app-border rounded-xl p-4 flex-row items-center justify-between">
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
        </View>
      )}

      <View className="gap-3">
        <Text className="text-sm font-medium text-text-primary">
          OAuth Client
        </Text>
        {hasDefaults && (
          <>
            <Pressable
              onPress={() => setUseDefaults((v) => !v)}
              disabled={connecting}
              className="flex-row items-center justify-between bg-surface border border-app-border rounded-xl px-4 py-3 active:bg-surface-alt"
            >
              <Text className="text-sm text-text-primary">
                Use Gremlin client
              </Text>
              <Switch
                value={useDefaults}
                onValueChange={setUseDefaults}
                disabled={connecting}
                trackColor={{ false: colors.border, true: colors.accent }}
              />
            </Pressable>
            {!useDefaults && (
              <View className="bg-surface border border-app-border rounded-xl p-4">
                <Text className="text-xs text-text-muted mb-1">
                  Redirect URI (add this to your OAuth app)
                </Text>
                <Text className="text-sm text-accent font-mono">
                  gremlin://oauth/callback
                </Text>
              </View>
            )}
          </>
        )}
        {!hasDefaults && (
          <View className="bg-surface border border-app-border rounded-xl p-4">
            <Text className="text-xs text-text-muted mb-1">
              Redirect URI (add this to your OAuth app)
            </Text>
            <Text className="text-sm text-accent font-mono">
              gremlin://oauth/callback
            </Text>
          </View>
        )}
        {!useDefaults && (
          <>
            <TextInput
              className={inputClass}
              value={clientId}
              onChangeText={setClientId}
              placeholder="Client ID"
              placeholderTextColor={colors.placeholderText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!connecting}
            />
            <TextInput
              className={inputClass}
              value={clientSecret}
              onChangeText={setClientSecret}
              placeholder="Client Secret"
              placeholderTextColor={colors.placeholderText}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!connecting}
            />
          </>
        )}
      </View>

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
        disabled={!effectiveClientId || !effectiveClientSecret}
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
          refetch={refetch}
        />
      ) : provider.connectionType === "apikey" ? (
        <ApiKeyDetailView
          provider={provider}
          defaultModel={defaultModel ?? null}
          refetch={refetch}
        />
      ) : provider.connectionType === "custom" ? (
        <View className="bg-surface border border-app-border rounded-xl p-5">
          <Text className="text-sm text-text-muted">
            This integration requires a custom connection flow that is not yet
            supported.
          </Text>
        </View>
      ) : provider.connectionType === "oauth" ? (
        <OAuthDetailView provider={provider} refetch={refetch} />
      ) : (
        <View className="bg-surface border border-app-border rounded-xl p-5">
          <Text className="text-sm text-text-muted">
            This connection type is not yet supported.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
