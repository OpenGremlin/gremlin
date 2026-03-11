import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
      className={`bg-neutral-900 rounded-xl p-4 ${isDefault ? "border border-indigo-500/40" : ""}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-100 flex-1">
          {model.name}
        </Text>
        {isDefault && (
          <View className="flex-row items-center gap-1.5 ml-2">
            <View className="w-2 h-2 rounded-full bg-indigo-400" />
            <Text className="text-xs text-indigo-400">Default</Text>
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
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100";

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
          <Text className="text-sm font-medium text-neutral-100">API Key</Text>
          <TextInput
            className={inputClass}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder={`Enter your ${provider.service} API key`}
            placeholderTextColor="#525252"
            secureTextEntry
            autoCapitalize="none"
          />
          <Pressable
            onPress={handleSaveApiKey}
            disabled={saving || !apiKeyInput.trim()}
            className="bg-indigo-600 rounded-lg px-4 py-2.5 items-center disabled:opacity-50"
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-sm font-medium text-white">Connect</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View className="bg-neutral-900 rounded-xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-neutral-100">API Key</Text>
            <Text className="text-xs text-neutral-500 mt-0.5">Configured</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-xs text-neutral-400">Active</Text>
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
          <Text className="text-sm font-medium text-neutral-100">Models</Text>
          {models.map((model) => {
            const isDefault =
              isDefaultProvider && defaultModel?.modelId === model.id;

            return (
              <ModelCard key={model.id} model={model} isDefault={isDefault}>
                {settingModel === model.id ? (
                  <ActivityIndicator color="#818cf8" size="small" />
                ) : isDefault ? null : !provider.hasConnection ? (
                  <Text className="text-xs text-neutral-600">
                    Add key first
                  </Text>
                ) : (
                  <Pressable onPress={() => handleSelectModel(model.id)}>
                    <Text className="text-xs font-medium text-indigo-400">
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
      <View className="bg-neutral-900 rounded-xl p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-neutral-100">AWS Credentials</Text>
          <Text className="text-xs text-neutral-500 mt-0.5">
            Managed server-side
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-green-400" />
          <Text className="text-xs text-neutral-400">Connected</Text>
        </View>
      </View>

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      {models.length > 0 && (
        <View className="gap-3">
          <Text className="text-sm font-medium text-neutral-100">Models</Text>
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
                  <ActivityIndicator color="#818cf8" size="small" />
                ) : isDefault ? null : isEnabled ? (
                  <>
                    <Pressable onPress={() => handleSetDefault(model.id)}>
                      <Text className="text-xs font-medium text-indigo-400">
                        Set Default
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleDisable(model.id)}>
                      <Text className="text-xs font-medium text-red-400">
                        Disable
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => handleEnable(model.id)}>
                    <Text className="text-xs font-medium text-emerald-400">
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
      <View>
        <Text className="text-xl font-semibold text-neutral-100">
          {provider.service}
        </Text>
        <Text className="text-sm text-neutral-400 mt-0.5">
          {provider.description}
        </Text>
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
        <View className="bg-neutral-900 rounded-xl p-5">
          <Text className="text-sm text-neutral-400">
            This integration requires a custom connection flow that is not yet
            supported.
          </Text>
        </View>
      ) : (
        <View className="bg-neutral-900 rounded-xl p-5">
          <Text className="text-sm text-neutral-300">
            Connect {provider.service} using the Gremlin Connect desktop app.
            The desktop app handles OAuth flows locally with your own
            credentials.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
