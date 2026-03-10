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
  ConnectApiKeyMutation,
  IntegrationProvidersQuery,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function IntegrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(IntegrationProvidersQuery);
  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!provider) {
    return <NotFound label="Integration not found." />;
  }

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await gql(ConnectApiKeyMutation, {
        providerId: id,
        apiKey: apiKeyInput.trim(),
      });
      setApiKeyInput("");
      refetch();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save API key",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100";

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

      {provider.connectionType === "apikey" &&
        (!provider.hasConnection ? (
          <View className="gap-3">
            <Text className="text-sm font-medium text-neutral-100">
              API Key
            </Text>
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
              <Text className="text-xs text-neutral-500 mt-0.5">
                Configured
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-green-400" />
              <Text className="text-xs text-neutral-400">Active</Text>
            </View>
          </View>
        ))}

      {provider.connectionType === "oauth" && (
        <View className="bg-neutral-900 rounded-xl p-5">
          <Text className="text-sm text-neutral-300">
            Connect {provider.service} using the Gremlin Connect desktop app.
            The desktop app handles OAuth flows locally with your own
            credentials.
          </Text>
        </View>
      )}

      {provider.connectionType === "bedrock" && (
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
      )}

      {saveError ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{saveError}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
