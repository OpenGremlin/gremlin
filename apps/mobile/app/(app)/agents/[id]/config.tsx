import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AgentQuery,
  RetireAgentMutation,
  UpdateAgentMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { AgentAvatar } from "../../../../src/shared/AgentAvatar";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { Toggle } from "../../../../src/shared/Toggle";

const INPUT_CLASS =
  "bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-sm";

export default function AgentConfigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, setData } = useQuery(AgentQuery, { id });
  const agent = data?.agent;

  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [retiring, setRetiring] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setSoul(agent.soul ?? "");
    setSandboxEnabled(agent.config?.sandbox?.enabled ?? false);
    setWebSearchEnabled(agent.config?.webSearch?.enabled ?? false);
  }, [agent]);

  const handleSave = useCallback(async () => {
    if (!agent) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await gql<{ updateAgent: typeof agent }>(
        UpdateAgentMutation,
        {
          id,
          input: {
            name: name.trim(),
            soul: soul.trim(),
            config: {
              sandbox: {
                enabled: sandboxEnabled,
              },
              webSearch: {
                enabled: webSearchEnabled,
              },
            },
          },
        },
      );
      setData({ agent: result.updateAgent });
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setSaving(false);
    }
  }, [id, agent, name, soul, sandboxEnabled, webSearchEnabled, setData]);

  const handleRetire = useCallback(() => {
    Alert.alert("Retire Agent", "Are you sure you want to retire this agent?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Retire",
        style: "destructive",
        onPress: async () => {
          setRetiring(true);
          try {
            await gql(RetireAgentMutation, { id });
            router.replace("/agents");
          } catch (err) {
            setSaveError(
              err instanceof Error ? err.message : "Failed to retire agent",
            );
            setRetiring(false);
          }
        },
      },
    ]);
  }, [id]);

  if (loading) {
    return <QueryResult loading error={null} />;
  }
  if (error) {
    return <QueryResult loading={false} error={error} />;
  }
  if (!agent) {
    return <NotFound label="Agent not found" />;
  }

  const hasChanges =
    name.trim() !== agent.name ||
    soul.trim() !== (agent.soul ?? "") ||
    sandboxEnabled !== (agent.config?.sandbox?.enabled ?? false) ||
    webSearchEnabled !== (agent.config?.webSearch?.enabled ?? false);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center">
        <AgentAvatar id={id} size={80} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Name</Text>
        <TextInput
          className={INPUT_CLASS}
          value={name}
          onChangeText={setName}
          placeholder="Agent name"
          placeholderTextColor="#737373"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Soul</Text>
        <TextInput
          className={INPUT_CLASS}
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent?"
          placeholderTextColor="#737373"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
        />
      </View>

      <View className="gap-4">
        <Text className="text-sm font-medium text-neutral-300">Tools</Text>

        <View className="bg-neutral-900 rounded-xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <View>
              <Text className="text-sm text-neutral-100">Model</Text>
              <Text className="text-xs text-neutral-500">
                {agent.config?.model?.modelId ?? "Default"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <Text className="text-sm text-neutral-100">Sandbox</Text>
            <Toggle
              enabled={sandboxEnabled}
              onChange={() => setSandboxEnabled((v) => !v)}
            />
          </View>

          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-sm text-neutral-100">Web Search</Text>
            <Toggle
              enabled={webSearchEnabled}
              onChange={() => setWebSearchEnabled((v) => !v)}
            />
          </View>
        </View>
      </View>

      {saveError ? (
        <Text className="text-red-400 text-sm">{saveError}</Text>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={saving || !hasChanges}
        className={`rounded-lg py-3 items-center ${
          hasChanges ? "bg-indigo-600" : "bg-neutral-700"
        } ${saving ? "opacity-50" : ""}`}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Save Changes</Text>
        )}
      </Pressable>

      {!agent.retired && (
        <Pressable
          onPress={handleRetire}
          disabled={retiring}
          className="rounded-lg py-3 items-center border border-red-800 mt-4"
        >
          {retiring ? (
            <ActivityIndicator color="#f87171" />
          ) : (
            <Text className="text-red-400 font-semibold">Retire Agent</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}
