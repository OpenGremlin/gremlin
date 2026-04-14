import { useQuery } from "@apollo/client";
import { router, Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { TaskQuery } from "../../../../../src/graphql/queries";
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
    errorPolicy: "ignore",
  });

  const task = taskData?.task;
  const title = task
    ? `Task: ${task.title ?? task.message ?? "Untitled"}`
    : "";
  const sandboxStreams = useSandboxOutput(taskId);
  const found = !!task;

  return (
    <>
      {!isPreview && <Stack.Screen options={{ headerShown: false }} />}
      <ChatScreen
        agentId={id}
        taskId={taskId}
        title={title}
        headerTitlePress={() => router.navigate(`/agents/${id}`)}
        headerRight={<VoiceModeButton agentId={id} />}
        loading={loading && !found}
        error={found ? undefined : error}
        onRetry={refetch}
        notFound={!loading && !error && !found}
        notFoundLabel="Task not found"
        sandboxStreams={sandboxStreams}
      />
    </>
  );
}
