import { useCallback } from "react";
import type {
  AgentLogCreatedSubscription,
  AgentLogsQuery,
  TaskLogCreatedSubscription,
  TaskLogsQuery as TaskLogsResult,
  TypedDocumentString,
} from "../graphql/generated/graphql";
import {
  AgentLogSubscription,
  AgentLogsQuery as AgentLogsDoc,
  TaskLogSubscription,
  TaskLogsQuery,
} from "../graphql/queries";
import { usePaginatedQuery } from "./usePaginatedQuery";
import { useSubscription } from "./useSubscription";

export type ChatMessage = AgentLogsQuery["agentLogs"]["edges"][number]["node"];

type LogsResult = AgentLogsQuery | TaskLogsResult;
type SubResult = AgentLogCreatedSubscription | TaskLogCreatedSubscription;

/** Should this message show a timestamp, or coalesce with the next same-role message within 15 min? */
export function shouldShowTimestamp(
  msg: ChatMessage,
  next: ChatMessage | undefined,
): boolean {
  if (!next) return true;
  if (msg.role !== next.role) return true;
  const gap =
    new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime();
  return Math.abs(gap) >= 900_000;
}

export function useLogMessages(
  scope: { agentId: string } | { taskId: string },
) {
  const isTask = "taskId" in scope;

  const query = isTask ? TaskLogsQuery : AgentLogsDoc;

  const {
    nodes: messages,
    loading,
    hasMore,
    loadMore,
    loadingMore,
    appendNode,
    replaceOrAppend,
  } = usePaginatedQuery<LogsResult, ChatMessage>(
    query as TypedDocumentString<LogsResult, Record<string, unknown>>,
    (d) => ("taskLogs" in d ? d.taskLogs : d.agentLogs),
    scope,
  );

  const subscription = isTask ? TaskLogSubscription : AgentLogSubscription;
  const subVars = isTask
    ? { taskId: (scope as { taskId: string }).taskId }
    : { agentId: (scope as { agentId: string }).agentId };

  useSubscription<SubResult>(
    String(subscription),
    subVars,
    useCallback(
      (data: SubResult) => {
        const msg: ChatMessage =
          "taskLogCreated" in data ? data.taskLogCreated : data.agentLogCreated;

        // TOOL entries with a result replace the matching call-only entry
        if (msg.role === "TOOL" && msg.toolResult) {
          replaceOrAppend(
            msg,
            (existing) =>
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

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    loadingMore,
  };
}
