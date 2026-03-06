import { useCallback } from "react";
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
    replaceOrAppend,
  } = usePaginatedQuery(TaskLogsQuery, (d) => d.taskLogs, { taskId });

  // Subscribe to new messages via WebSocket
  useSubscription(
    TaskLogSubscription,
    { taskId },
    useCallback(
      (data) => {
        const msg = data.taskLogCreated;

        // TOOL entries with a result update the matching call-only entry (same id)
        if (msg.role === "TOOL" && msg.toolResult) {
          replaceOrAppend(msg, (existing) =>
            existing.role === "TOOL" &&
            existing.toolName === msg.toolName &&
            !existing.toolResult,
          );
        } else {
          appendNode(msg);
        }
      },
      [appendNode, replaceOrAppend],
    ),
  );

  return { messages, loading, hasMore, loadMore, loadingMore };
}
