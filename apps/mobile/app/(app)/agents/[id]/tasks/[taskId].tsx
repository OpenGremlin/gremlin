import { router, Stack, useLocalSearchParams } from "expo-router";
import { TaskQuery } from "../../../../../src/graphql/queries";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { useSandboxOutput } from "../../../../../src/hooks/useSandboxOutput";
import { ChatScreen } from "../../../../../src/shared/ChatScreen";

export default function TaskThreadScreen() {
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId: string;
  }>();

  const {
    data: taskData,
    loading,
    error,
    refetch,
  } = useQuery(TaskQuery, { id: taskId });

  const task = taskData?.task;
  const sandboxStreams = useSandboxOutput(taskId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen
        agentId={id}
        taskId={taskId}
        title={task ? `Task: ${task.title ?? task.message ?? "Untitled"}` : ""}
        headerTitlePress={() => router.navigate(`/agents/${id}`)}
        loading={loading}
        error={error}
        onRetry={refetch}
        notFound={!loading && !error && !task}
        notFoundLabel="Task not found"
        taskFiles={task?.files}
        sandboxStreams={sandboxStreams}
      />
    </>
  );
}
