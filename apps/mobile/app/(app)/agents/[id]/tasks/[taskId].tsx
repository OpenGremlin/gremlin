import { useQuery } from "@apollo/client";
import { router, Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { TaskQuery } from "../../../../../src/graphql/queries";
import { useBeadInfo } from "../../../../../src/hooks/useBeadInfo";
import { useSandboxOutput } from "../../../../../src/hooks/useSandboxOutput";
import { ChatScreen } from "../../../../../src/shared/ChatScreen";
import { VoiceModeButton } from "../../../../../src/shared/VoiceModeButton";

export default function TaskThreadScreen() {
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId: string;
  }>();
  const isPreview = useIsPreview();

  const {
    data: taskData,
    loading,
    error,
    refetch,
  } = useQuery(TaskQuery, {
    variables: { id: taskId },
    // For bead-dispatched work, the Task entity may not exist (the lane key
    // is a bead ID, not a Task UUID). Don't fail the page — fall back to
    // bead data and still show the task lane logs.
    errorPolicy: "ignore",
  });

  // For bead-dispatched work, taskId is a bead ID (e.g. "gremlin-3m2").
  // The Task entity may not exist, but the AgentLog entries do.
  const isMaybeBeadId = taskId?.includes("-") && !taskId?.includes(" ");
  const bead = useBeadInfo(isMaybeBeadId && !taskData?.task ? taskId : null);

  const task = taskData?.task;
  const title = task
    ? `Task: ${task.title ?? task.message ?? "Untitled"}`
    : bead
      ? bead.title
      : "";
  const sandboxStreams = useSandboxOutput(taskId);

  return (
    <>
      {!isPreview && <Stack.Screen options={{ headerShown: false }} />}
      <ChatScreen
        agentId={id}
        taskId={taskId}
        title={title}
        headerTitlePress={() => router.navigate(`/agents/${id}`)}
        headerRight={<VoiceModeButton agentId={id} />}
        loading={loading && !bead}
        error={task || bead ? undefined : error}
        onRetry={refetch}
        notFound={!loading && !error && !task && !bead}
        notFoundLabel="Task not found"
        sandboxStreams={sandboxStreams}
      />
    </>
  );
}
