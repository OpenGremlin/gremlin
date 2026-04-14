import { useQuery } from "@apollo/client";
import { router, Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { TaskQuery } from "../../../src/graphql/queries";
import { useSandboxOutput } from "../../../src/hooks/useSandboxOutput";
import { ChatScreen } from "../../../src/shared/ChatScreen";
import { VoiceModeButton } from "../../../src/shared/VoiceModeButton";

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPreview = useIsPreview();

  const {
    data: taskData,
    loading,
    error,
    refetch,
  } = useQuery(TaskQuery, {
    variables: { id },
    errorPolicy: "ignore",
  });

  const task = taskData?.task;
  const agentId = task?.agent?.id ?? "";
  const title = task
    ? `Task: ${task.title ?? task.message ?? "Untitled"}`
    : "";
  const sandboxStreams = useSandboxOutput(id);
  const found = !!task;

  return (
    <>
      {!isPreview && <Stack.Screen options={{ headerShown: false }} />}
      <ChatScreen
        agentId={agentId}
        taskId={id}
        title={title}
        headerTitlePress={() =>
          agentId ? router.navigate(`/agents/${agentId}`) : undefined
        }
        headerRight={agentId ? <VoiceModeButton agentId={agentId} /> : undefined}
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
