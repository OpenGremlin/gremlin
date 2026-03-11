import cronstrue from "cronstrue";
import { router, useLocalSearchParams } from "expo-router";
import { Play, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  AgentJobQuery as AgentJobQueryType,
  JobTaskCreatedSubscription as JobTaskCreatedType,
  UpdateAgentJobMutation as UpdateAgentJobType,
} from "../../../src/graphql/generated/graphql";
import {
  AgentJobQuery,
  AgentsQuery,
  DeleteAgentJobMutation as DeleteAgentJobDoc,
  JobTaskCreatedSubscription,
  UpdateAgentJobMutation as UpdateAgentJobDoc,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { gql } from "../../../src/lib/auth";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { formatDate } from "../../../src/shared/formatDate";
import { PickerModal } from "../../../src/shared/PickerModal";
import { NotFound, QueryResult } from "../../../src/shared/QueryResult";
import { SaveButton } from "../../../src/shared/SaveButton";
import { TimezonePicker } from "../../../src/shared/TimezonePicker";
import { Toggle } from "../../../src/shared/Toggle";

type Job = NonNullable<AgentJobQueryType["agentJob"]>;
type JobTask = Job["tasks"][number];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(AgentJobQuery, { id: id ?? "" });
  const { data: agentsData } = useQuery(AgentsQuery);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);

  const agentOptions = useMemo(
    () =>
      (agentsData?.agents ?? [])
        .filter((a) => !a.retired)
        .map((a) => ({ value: a.id, label: a.name })),
    [agentsData],
  );

  const [name, setName] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [savedJob, setSavedJob] = useState<Job | null>(null);

  const [liveTasks, setLiveTasks] = useState<JobTask[]>([]);
  useSubscription<JobTaskCreatedType>(
    JobTaskCreatedSubscription,
    { jobId: id ?? "" },
    useCallback((update) => {
      setLiveTasks((prev) => {
        if (prev.some((t) => t.id === update.jobTaskCreated.id)) return prev;
        return [update.jobTaskCreated, ...prev];
      });
    }, []),
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const job = savedJob ?? data?.agentJob ?? null;

  if (!job) {
    return <NotFound label="Job not found." />;
  }

  const currentName = name ?? job.name;
  const currentRecurrence = recurrence ?? job.recurrence;
  const currentDescription = description ?? job.description;
  const currentTimezone = timezone ?? job.timezone;
  const currentAgentId = agentId ?? job.agent.id;

  const isDirty =
    name !== null ||
    recurrence !== null ||
    description !== null ||
    timezone !== null ||
    agentId !== null;

  let cronHuman: string | null = null;
  if (job.cronExpression) {
    try {
      cronHuman = cronstrue.toString(job.cronExpression);
    } catch {}
  }

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    setSaveError(null);
    try {
      const input: Record<string, string> = {};
      if (name !== null) input.name = name;
      if (recurrence !== null) input.recurrence = recurrence;
      if (description !== null) input.description = description;
      if (timezone !== null) input.timezone = timezone;
      if (agentId !== null) input.agentId = agentId;

      const result = await gql<UpdateAgentJobType>(UpdateAgentJobDoc, {
        id,
        input,
      });
      if (result.updateAgentJob) {
        setSavedJob({
          ...job,
          ...result.updateAgentJob,
          tasks: job.tasks,
        } as Job);
      }
      setName(null);
      setAgentId(null);
      setRecurrence(null);
      setDescription(null);
      setTimezone(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePause() {
    if (!job) return;
    setTogglingPause(true);
    try {
      const result = await gql<UpdateAgentJobType>(UpdateAgentJobDoc, {
        id,
        input: { paused: !job.paused },
      });
      if (result.updateAgentJob) {
        setSavedJob({
          ...job,
          ...result.updateAgentJob,
          tasks: job.tasks,
        } as Job);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingPause(false);
    }
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      await gql(`mutation TriggerJob($id: ID!) { triggerJob(id: $id) }`, {
        id,
      });
      setTriggered(true);
      setTimeout(() => setTriggered(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriggering(false);
    }
  }

  async function handleDelete() {
    Alert.alert("Delete Job", "Delete this job? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await gql(DeleteAgentJobDoc, { id });
            router.back();
          } catch {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const serverIds = new Set(job.tasks.map((t) => t.id));
  const allTasks = [
    ...liveTasks.filter((t) => !serverIds.has(t.id)),
    ...job.tasks,
  ].slice(0, 10);

  const inputClass =
    "bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-sm";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3">
        <AgentAvatar id={job.agent.id} size={48} />
        <View className="min-w-0 flex-1">
          <Text
            className="text-xl font-semibold text-neutral-100"
            numberOfLines={1}
          >
            {job.name}
          </Text>
          <Text className="text-sm text-neutral-400 mt-0.5">
            {job.agent.name}
          </Text>
        </View>
      </View>

      <View
        className={`bg-neutral-900 rounded-xl p-4 gap-3 ${job.paused ? "opacity-40" : ""}`}
      >
        <View className="gap-1">
          <Text className="text-xs text-neutral-500">Schedule</Text>
          <Text className="text-sm text-neutral-200">
            {cronHuman ?? job.recurrence}
          </Text>
        </View>
        <View className="gap-1">
          <Text className="text-xs text-neutral-500">Next run</Text>
          <Text className="text-sm text-neutral-200">
            {job.paused
              ? "Paused"
              : formatDate(job.nextRun, "Not scheduled", currentTimezone)}
          </Text>
        </View>
        {job.cronExpression ? (
          <View className="gap-1">
            <Text className="text-xs text-neutral-500">Cron</Text>
            <Text className="text-sm font-mono text-neutral-400">
              {job.cronExpression}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-2">
          <Toggle
            enabled={job.paused}
            disabled={togglingPause}
            onChange={handleTogglePause}
          />
          <Text className="text-sm text-neutral-300">Pause schedule</Text>
        </View>
        <View className="flex-1" />
        {!job.paused && (
          <Pressable
            onPress={handleTrigger}
            disabled={triggering}
            className="flex-row items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg disabled:opacity-50"
          >
            <Play size={14} color="white" />
            <Text className="text-sm font-medium text-white">
              {triggering
                ? "Triggering..."
                : triggered
                  ? "Triggered"
                  : "Run now"}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="gap-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Configuration
        </Text>
        <View className="bg-neutral-900 rounded-xl p-4 gap-4">
          <View className="gap-2">
            <Text className="text-xs text-neutral-500">Agent</Text>
            <Pressable
              className={inputClass}
              onPress={() => setAgentPickerOpen(true)}
            >
              <Text className="text-sm text-neutral-100">
                {agentOptions.find((a) => a.value === currentAgentId)?.label ??
                  job.agent.name}
              </Text>
            </Pressable>
            <PickerModal
              visible={agentPickerOpen}
              title="Select Agent"
              options={agentOptions}
              selected={currentAgentId}
              onSelect={(val) => setAgentId(val === job.agent.id ? null : val)}
              onClose={() => setAgentPickerOpen(false)}
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-neutral-500">Name</Text>
            <TextInput
              className={inputClass}
              value={currentName}
              onChangeText={(val) => setName(val === job.name ? null : val)}
              placeholderTextColor="#737373"
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-neutral-500">Cron Expression</Text>
            <TextInput
              className={inputClass}
              value={currentRecurrence}
              onChangeText={(val) =>
                setRecurrence(val === job.recurrence ? null : val)
              }
              placeholderTextColor="#737373"
              autoCapitalize="none"
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-neutral-500">Timezone</Text>
            <TimezonePicker
              value={currentTimezone}
              onChange={(val) => setTimezone(val === job.timezone ? null : val)}
              className={inputClass}
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-neutral-500">Description</Text>
            <TextInput
              className={inputClass}
              value={currentDescription ?? ""}
              onChangeText={(val) =>
                setDescription(val === job.description ? null : val)
              }
              placeholderTextColor="#737373"
              multiline
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          </View>

          <View className="flex-row items-center gap-3 pt-2 border-t border-neutral-800">
            <SaveButton
              onPress={handleSave}
              disabled={!isDirty}
              saving={saving}
              label="Save changes"
            />
            {isDirty && (
              <Pressable
                onPress={() => {
                  setName(null);
                  setAgentId(null);
                  setRecurrence(null);
                  setDescription(null);
                  setTimezone(null);
                }}
              >
                <Text className="text-sm text-neutral-400">Discard</Text>
              </Pressable>
            )}
          </View>

          {saveError ? (
            <Text className="text-sm text-red-400">{saveError}</Text>
          ) : null}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          History
        </Text>
        {allTasks.length === 0 ? (
          <View className="bg-neutral-900 rounded-xl p-6 items-center">
            <Text className="text-sm text-neutral-500">
              No previous runs yet.
            </Text>
          </View>
        ) : (
          <View className="bg-neutral-900 rounded-xl overflow-hidden">
            {allTasks.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() =>
                  router.push(`/agents/${t.agent.id}/tasks/${t.id}`)
                }
                className={`px-4 py-3 ${i > 0 ? "border-t border-neutral-800" : ""}`}
              >
                <Text className="text-sm text-neutral-100" numberOfLines={1}>
                  {t.title ?? "Untitled task"}
                </Text>
                <Text className="text-xs text-neutral-500 mt-0.5">
                  {formatDate(t.createdAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="pt-4 border-t border-neutral-800/60">
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          className="self-start flex-row items-center gap-2 px-4 py-2 bg-neutral-800 rounded-lg disabled:opacity-50"
        >
          <Trash2 size={16} color="#f87171" />
          <Text className="text-sm font-medium text-red-400">
            {deleting ? "Deleting..." : "Delete Job"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
