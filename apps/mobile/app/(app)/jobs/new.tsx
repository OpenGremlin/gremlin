import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AgentsQuery,
  CreateAgentJobMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { PickerModal } from "../../../src/shared/PickerModal";
import { TimezonePicker } from "../../../src/shared/TimezonePicker";

export default function NewJobScreen() {
  const colors = useNavigationTheme();
  const { data: agentsData } = useQuery(AgentsQuery);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);

  const agentOptions = useMemo(
    () =>
      (agentsData?.agents ?? [])
        .filter((a) => !a.retired)
        .map((a) => ({
          value: a.id,
          label: a.name,
          icon: <AgentAvatar id={a.id} size={28} />,
        })),
    [agentsData],
  );

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
      const result = await gql(CreateAgentJobMutation, {
        input: {
          name: name.trim(),
          description: description.trim(),
          recurrence: recurrence.trim(),
          timezone,
          agentId: agentId.trim(),
        },
      });
      router.replace(`/jobs/${result.createAgentJob.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "bg-input-bg border border-input-border rounded-lg px-4 py-3 text-text-primary text-sm";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Name</Text>
        <TextInput
          className={inputClass}
          value={name}
          onChangeText={setName}
          placeholder="Job name"
          placeholderTextColor={colors.placeholderText}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Agent</Text>
        <Pressable
          className={inputClass}
          onPress={() => setAgentPickerOpen(true)}
        >
          <Text
            className={`text-sm ${agentId ? "text-text-primary" : "text-text-muted"}`}
          >
            {agentOptions.find((a) => a.value === agentId)?.label ??
              "Select agent"}
          </Text>
        </Pressable>
        <PickerModal
          visible={agentPickerOpen}
          title="Select Agent"
          options={agentOptions}
          selected={agentId}
          onSelect={setAgentId}
          onClose={() => setAgentPickerOpen(false)}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">
          Recurrence
        </Text>
        <TextInput
          className={inputClass}
          value={recurrence}
          onChangeText={setRecurrence}
          placeholder="Every weekday at 9am"
          placeholderTextColor={colors.placeholderText}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">
          Timezone
        </Text>
        <TimezonePicker
          value={timezone}
          onChange={setTimezone}
          className={inputClass}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">
          Description
        </Text>
        <TextInput
          className={inputClass}
          value={description}
          onChangeText={setDescription}
          placeholder="What should this job do?"
          placeholderTextColor={colors.placeholderText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      {error ? <Text className="text-error text-sm">{error}</Text> : null}

      <Pressable
        onPress={handleCreate}
        disabled={saving || !canSubmit}
        className="bg-accent rounded-xl py-3 items-center mt-2 disabled:opacity-50"
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
