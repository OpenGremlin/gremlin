import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AgentsQuery,
  CreateAgentJobMutation,
} from "../../../src/graphql/queries";
import { execute } from "../../../src/lib/apolloClient";
import { agentNameColor } from "../../../src/lib/color";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { Button } from "../../../src/shared/Button";
import { Input } from "../../../src/shared/Input";
import { presentPicker } from "../../../src/shared/PickerModal";
import { TabScrollView } from "../../../src/shared/TabScrollView";
import { TimezonePicker } from "../../../src/shared/TimezonePicker";

export default function NewJobScreen() {
  const { data: agentsData } = useQuery(AgentsQuery);

  const agentOptions = useMemo(
    () =>
      (agentsData?.agents ?? [])
        .filter((a) => !a.retired)
        .map((a) => ({
          value: a.id,
          label: a.name,
          labelColor: agentNameColor(a.hexColor),
          icon: <AgentAvatar id={a.id} size={28} />,
        })),
    [agentsData],
  );

  const selectedAgent = agentOptions.find((a) => a.value === agentId);

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
      const result = await execute(CreateAgentJobMutation, {
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

  return (
    <TabScrollView
      contentContainerClassName="px-4 pt-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">Name</Text>
        <Input value={name} onChangeText={setName} placeholder="Job name" />
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">Agent</Text>
        <Pressable
          className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5"
          onPress={() =>
            presentPicker({
              title: "Select Agent",
              options: agentOptions,
              selected: agentId,
              onSelect: setAgentId,
            })
          }
        >
          <Text
            className={`text-sm ${selectedAgent ? "font-bold" : "text-text-muted"}`}
            style={
              selectedAgent ? { color: selectedAgent.labelColor } : undefined
            }
          >
            {selectedAgent?.label ?? "Select agent"}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">
          Recurrence
        </Text>
        <Input
          value={recurrence}
          onChangeText={setRecurrence}
          placeholder="Every weekday at 9am"
        />
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">
          Timezone
        </Text>
        <TimezonePicker
          value={timezone}
          onChange={setTimezone}
          className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm leading-[18px] text-text-primary"
        />
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">
          Description
        </Text>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="What should this job do?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      {error ? <Text className="text-error text-sm">{error}</Text> : null}

      <Button
        onPress={handleCreate}
        disabled={!canSubmit}
        loading={saving}
        size="lg"
      >
        Create
      </Button>
    </TabScrollView>
  );
}
