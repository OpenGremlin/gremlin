import { Redirect, useLocalSearchParams } from "expo-router";

/** Legacy route — redirects to /tasks/[id] */
export default function LegacyTaskRedirect() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  return <Redirect href={`/tasks/${taskId}`} />;
}
