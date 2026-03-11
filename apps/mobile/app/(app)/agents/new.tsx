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

export default function NewAgentScreen() {
  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await gql<{ createAgent: { id: string } }>(
        CreateAgentMutation,
        { input: { name: name.trim(), soul: soul.trim() } },
      );
      router.replace(`/agents/${result.createAgent.id}/config`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-sm";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Name</Text>
        <TextInput
          className={inputClass}
          value={name}
          onChangeText={setName}
          placeholder="Agent name"
          placeholderTextColor="#737373"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Soul</Text>
        <TextInput
          className={inputClass}
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent? What should they do?"
          placeholderTextColor="#737373"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      {error ? <Text className="text-red-400 text-sm">{error}</Text> : null}

      <Pressable
        onPress={handleCreate}
        disabled={creating || !name.trim()}
        className="bg-indigo-600 rounded-lg py-3 items-center mt-2 disabled:opacity-50"
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
