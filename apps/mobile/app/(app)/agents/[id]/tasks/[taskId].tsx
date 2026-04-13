import { gql, useQuery } from "@apollo/client";
import { router, Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { TaskQuery } from "../../../../../src/graphql/queries";
import { useSandboxOutput } from "../../../../../src/hooks/useSandboxOutput";
import { ChatScreen } from "../../../../../src/shared/ChatScreen";
import { VoiceModeButton } from "../../../../../src/shared/VoiceModeButton";

const BEAD_TITLE_QUERY = gql`
  query BeadTitle($id: ID!) {
    bead(id: $id) {
      id
      title
    }
  }
`;

export default function TaskThreadScreen() {
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId: string;
  }>();
  const isPreview = useIsPreview();

  // Bead IDs contain a hyphen (e.g. "gremlin-3m2"); Task UUIDs don't.
  const isBeadId = taskId?.includes("-") && !taskId?.includes(" ");

  const {
    data: taskData,
    loading: taskLoading,
    error: taskError,
    refetch,
  } = useQuery(TaskQuery, {
    variables: { id: taskId },
    skip: !!isBeadId,
    errorPolicy: "ignore",
  });

  const { data: beadData, loading: beadLoading } = useQuery(
    BEAD_TITLE_QUERY,
    {
      variables: { id: taskId ?? "" },
      skip: !isBeadId,
      fetchPolicy: "network-only",
    },
  );
  const bead = beadData?.bead as { id: string; title: string } | null;

  const task = taskData?.task;
  const title = task
    ? `Task: ${task.title ?? task.message ?? "Untitled"}`
    : bead
      ? bead.title
      : "";
  const sandboxStreams = useSandboxOutput(taskId);
  const loading = isBeadId ? beadLoading : taskLoading;
  const error = isBeadId ? undefined : taskError;
  const found = !!(task || bead);

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
