import { useQuery, useSubscription } from "@apollo/client";
import cronstrue from "cronstrue";
import { router, useLocalSearchParams } from "expo-router";
import { Play } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { AgentJobQuery as AgentJobQueryType } from "../../../src/graphql/generated/graphql";
import {
  AgentJobQuery,
  AgentsQuery,
  DeleteAgentJobMutation as DeleteAgentJobDoc,
  JobTaskCreatedSubscription,
  TriggerJobMutation,
  UpdateAgentJobMutation as UpdateAgentJobDoc,
} from "../../../src/graphql/queries";
import { useFormOverlay } from "../../../src/hooks/useFormOverlay";
import { execute } from "../../../src/lib/apolloClient";
import { AgentAvatar } from "../../../src/shared/AgentAvatar";
import { Card } from "../../../src/shared/Card";
import { DestructiveButton } from "../../../src/shared/DestructiveButton";
import { formatDate } from "../../../src/shared/formatDate";
import { Input } from "../../../src/shared/Input";
import { presentPicker } from "../../../src/shared/PickerModal";
import { NotFound, QueryResult } from "../../../src/shared/QueryResult";
import { SaveButton } from "../../../src/shared/SaveButton";
import { TabScrollView } from "../../../src/shared/TabScrollView";
import { TimezonePicker } from "../../../src/shared/TimezonePicker";
import { Toggle } from "../../../src/shared/Toggle";

type Job = NonNullable<AgentJobQueryType["agentJob"]>;
type JobTask = Job["tasks"][number];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(AgentJobQuery, {
    variables: { id: id ?? "" },
  });
  const { data: agentsData } = useQuery(AgentsQuery);

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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [savedJob, setSavedJob] = useState<Job | null>(null);

  const [liveTasks, setLiveTasks] = useState<JobTask[]>([]);
  useSubscription(JobTaskCreatedSubscription, {
    variables: { jobId: id ?? "" },
    onData: ({ data: { data } }) => {
      if (!data) return;
      setLiveTasks((prev) => {
        if (prev.some((t) => t.id === data.jobTaskCreated.id)) return prev;
        return [data.jobTaskCreated, ...prev];
      });
    },
  });

  const job = savedJob ?? data?.agentJob ?? null;

  const form = useFormOverlay({
    name: job?.name ?? "",
    recurrence: job?.recurrence ?? "",
    description: job?.description ?? "",
    timezone: job?.timezone ?? "",
    agentId: job?.agent.id ?? "",
  });

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!job) {
    return <NotFound label="Job not found." />;
  }

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
      const result = await execute(UpdateAgentJobDoc, {
        id: id ?? "",
        input: form.dirtyFields(),
      });
      if (result.updateAgentJob) {
        setSavedJob({
          ...job,
          ...result.updateAgentJob,
          tasks: job.tasks,
        } as Job);
      }
      form.discard();
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
      const result = await execute(UpdateAgentJobDoc, {
        id: id ?? "",
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
      await execute(TriggerJobMutation, { id: id ?? "" });
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
            await execute(DeleteAgentJobDoc, { id: id ?? "" });
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

  return (
    <TabScrollView
      contentContainerClassName="px-4 pt-6 gap-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.push(`/agents/${job.agent.id}`)}>
          <AgentAvatar id={job.agent.id} size={48} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text
            className="text-xl font-semibold text-text-primary"
            numberOfLines={1}
          >
            {job.name}
          </Text>
          <Text className="text-sm text-text-muted mt-0.5">
            {job.agent.name}
          </Text>
        </View>
      </View>

      <Card className={`p-4 gap-3 ${job.paused ? "opacity-40" : ""}`}>
        <View className="gap-1">
          <Text className="text-xs text-text-muted">Schedule</Text>
          <Text className="text-sm text-text-secondary">
            {cronHuman ?? job.recurrence}
          </Text>
        </View>
        <View className="gap-1">
          <Text className="text-xs text-text-muted">Next run</Text>
          <Text className="text-sm text-text-secondary">
            {job.paused
              ? "Paused"
              : formatDate(job.nextRun, "Not scheduled", form.current.timezone)}
          </Text>
        </View>
        {job.cronExpression ? (
          <View className="gap-1">
            <Text className="text-xs text-text-muted">Cron</Text>
            <Text className="text-sm font-mono text-text-muted">
              {job.cronExpression}
            </Text>
          </View>
        ) : null}
      </Card>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-2">
          <Toggle
            enabled={job.paused}
            disabled={togglingPause}
            onChange={handleTogglePause}
          />
          <Text className="text-sm text-text-secondary">Pause schedule</Text>
        </View>
        <View className="flex-1" />
        {!job.paused && (
          <Pressable
            onPress={handleTrigger}
            disabled={triggering || job.agent.retired}
            className={`flex-row items-center gap-2 px-4 py-2 bg-accent rounded-lg ${triggering || job.agent.retired ? "opacity-40" : ""}`}
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
        <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Configuration
        </Text>
        <Card className="p-4 gap-4">
          <View className="gap-2">
            <Text className="text-xs text-text-muted">Agent</Text>
            <Pressable
              onPress={() =>
                presentPicker({
                  title: "Select Agent",
                  options: agentOptions,
                  selected: form.current.agentId,
                  onSelect: (val) => form.update("agentId", val),
                })
              }
            >
              <View className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5">
                <Text className="text-sm text-text-primary">
                  {agentOptions.find((a) => a.value === form.current.agentId)
                    ?.label ?? job.agent.name}
                </Text>
              </View>
            </Pressable>
          </View>
          <View className="gap-2">
            <Text className="text-xs text-text-muted">Name</Text>
            <Input
              value={form.current.name}
              onChangeText={(val) => form.update("name", val)}
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-text-muted">Recurrence</Text>
            <Input
              value={form.current.recurrence}
              onChangeText={(val) => form.update("recurrence", val)}
              autoCapitalize="none"
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-text-muted">Timezone</Text>
            <TimezonePicker
              value={form.current.timezone}
              onChange={(val) => form.update("timezone", val)}
              className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm leading-[18px] text-text-primary"
            />
          </View>
          <View className="gap-2">
            <Text className="text-xs text-text-muted">Description</Text>
            <Input
              value={form.current.description}
              onChangeText={(val) => form.update("description", val)}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          </View>

          <View className="gap-3 pt-2">
            <SaveButton
              onPress={handleSave}
              disabled={!form.isDirty}
              saving={saving}
              label="Save changes"
              size="lg"
            />
            {form.isDirty && (
              <Pressable onPress={form.discard} className="items-center">
                <Text className="text-sm text-text-muted">Discard</Text>
              </Pressable>
            )}
          </View>

          {saveError ? (
            <Text className="text-sm text-error">{saveError}</Text>
          ) : null}
        </Card>
      </View>

      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          History
        </Text>
        {allTasks.length === 0 ? (
          <Card className="p-6 items-center">
            <Text className="text-sm text-text-muted">
              No previous runs yet.
            </Text>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {allTasks.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/tasks/${t.id}`)}
                className={`px-4 py-3 ${i > 0 ? "border-t border-app-border" : ""}`}
              >
                <Text className="text-sm text-text-primary" numberOfLines={1}>
                  {t.title ?? "Untitled task"}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  {formatDate(t.createdAt)}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      <View className="pt-4 border-t border-border-subtle">
        <DestructiveButton
          onPress={handleDelete}
          loading={deleting}
          label="Delete Job"
          loadingLabel="Deleting..."
          size="lg"
        />
      </View>
    </TabScrollView>
  );
}
