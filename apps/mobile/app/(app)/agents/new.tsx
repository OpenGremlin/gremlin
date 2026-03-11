import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CreateAgentMutation } from "../../../src/graphql/queries";
import { gql } from "../../../src/lib/auth";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

export default function NewAgentScreen() {
  const colors = useNavigationTheme();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!id.trim() || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await gql(CreateAgentMutation, {
        input: { id: id.trim(), name: name.trim(), soul: soul.trim() },
      });
      router.replace(`/agents/${result.createAgent.id}/config`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "bg-surface-alt border border-app-border rounded-lg px-4 py-3 text-text-primary text-sm";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">ID</Text>
        <TextInput
          className={inputClass}
          value={id}
          onChangeText={setId}
          placeholder="e.g. bob, research-agent"
          placeholderTextColor={colors.placeholderText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Name</Text>
        <TextInput
          className={inputClass}
          value={name}
          onChangeText={setName}
          placeholder="Agent name"
          placeholderTextColor={colors.placeholderText}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Soul</Text>
        <TextInput
          className={inputClass}
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent? What should they do?"
          placeholderTextColor={colors.placeholderText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}

      <Pressable
        onPress={handleCreate}
        disabled={creating || !id.trim() || !name.trim()}
        className="bg-indigo-600 rounded-lg py-3 px-6 items-center mt-2 self-start disabled:opacity-50"
      >
        {creating ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Create Agent</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
