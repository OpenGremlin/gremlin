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
import { CreateAgentJobMutation } from "../../../src/graphql/queries";
import { gql } from "../../../src/lib/auth";

export default function NewJobScreen() {
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    name.trim() && agentId.trim() && recurrence.trim() && description.trim();

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      const result = await gql<{ createAgentJob: { id: string } }>(
        CreateAgentJobMutation,
        {
          input: {
            name: name.trim(),
            description: description.trim(),
            recurrence: recurrence.trim(),
            timezone,
            agentId: agentId.trim() || undefined,
          },
        },
      );
      router.replace(`/jobs/${result.createAgentJob.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSaving(false);
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
          placeholder="Job name"
          placeholderTextColor="#737373"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Agent ID</Text>
        <TextInput
          className={inputClass}
          value={agentId}
          onChangeText={setAgentId}
          placeholder="Agent ID"
          placeholderTextColor="#737373"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">
          Cron Expression
        </Text>
        <TextInput
          className={inputClass}
          value={recurrence}
          onChangeText={setRecurrence}
          placeholder="0 9 * * *"
          placeholderTextColor="#737373"
          autoCapitalize="none"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">Timezone</Text>
        <TextInput
          className={inputClass}
          value={timezone}
          onChangeText={setTimezone}
          placeholder="America/New_York"
          placeholderTextColor="#737373"
          autoCapitalize="none"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-300">
          Description
        </Text>
        <TextInput
          className={inputClass}
          value={description}
          onChangeText={setDescription}
          placeholder="What should this job do?"
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
        disabled={saving || !canSubmit}
        className="bg-indigo-600 rounded-lg py-3 items-center mt-2 disabled:opacity-50"
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Create</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
