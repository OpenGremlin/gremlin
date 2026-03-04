import { useCallback, useEffect, useRef, useState } from "react";
import { TaskLogSubscription, TaskLogsQuery } from "../../graphql/queries";
import { usePaginatedQuery } from "../../usePaginatedQuery";
import { useSubscription } from "../../useSubscription";

export function useTaskChatMessages(taskId: string) {
  const {
    nodes: messages,
    loading,
    hasMore,
    loadMore,
    loadingMore,
    appendNode,
  } = usePaginatedQuery(TaskLogsQuery, (d) => d.taskLogs, { taskId });

  const [isAgentActive, setIsAgentActive] = useState(false);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Subscribe to new messages via WebSocket
  useSubscription(
    TaskLogSubscription,
    { taskId },
    useCallback(
      (data) => {
        const msg = data.taskLogCreated;
        appendNode(msg);

        if (msg.role === "AGENT") {
          setIsAgentActive(true);
          clearTimeout(activeTimerRef.current);
          activeTimerRef.current = setTimeout(
            () => setIsAgentActive(false),
            2000,
          );
        }
      },
      [appendNode],
    ),
  );

  // Cleanup agent active timer
  useEffect(() => {
    return () => clearTimeout(activeTimerRef.current);
  }, []);

  return { messages, loading, hasMore, loadMore, loadingMore, isAgentActive };
}
