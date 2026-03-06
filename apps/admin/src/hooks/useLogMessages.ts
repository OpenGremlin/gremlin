import { useCallback } from "react";
import type { AgentLogsQuery } from "../graphql/generated/graphql";
import {
  AgentLogSubscription,
  AgentLogsQuery as AgentLogsDoc,
  TaskLogSubscription,
  TaskLogsQuery,
} from "../graphql/queries";
import { usePaginatedQuery } from "../usePaginatedQuery";
import { useSubscription } from "../useSubscription";

export type ChatMessage = AgentLogsQuery["agentLogs"]["edges"][number]["node"];

export function useLogMessages(
  scope: { agentId: string } | { taskId: string },
) {
  const isTask = "taskId" in scope;

  const query = isTask ? TaskLogsQuery : AgentLogsDoc;
  const selector = isTask
    ? (d: { taskLogs: unknown }) => d.taskLogs
    : (d: { agentLogs: unknown }) => d.agentLogs;

  const {
    nodes: messages,
    loading,
    hasMore,
    loadMore,
    loadingMore,
    appendNode,
    replaceOrAppend,
    // biome-ignore lint/suspicious/noExplicitAny: query/selector types diverge by scope
  } = usePaginatedQuery(query as any, selector as any, scope);

  const subscription = isTask ? TaskLogSubscription : AgentLogSubscription;
  const subVars = isTask
    ? { taskId: (scope as { taskId: string }).taskId }
    : { agentId: (scope as { agentId: string }).agentId };

  useSubscription(
    // biome-ignore lint/suspicious/noExplicitAny: subscription variable types diverge
    subscription as any,
    subVars,
    useCallback(
      // biome-ignore lint/suspicious/noExplicitAny: subscription event shape varies
      (data: any) => {
        const key = isTask ? "taskLogCreated" : "agentLogCreated";
        const msg = data[key] as ChatMessage;

        // TOOL entries with a result replace the matching call-only entry
        if (msg.role === "TOOL" && msg.toolResult) {
          replaceOrAppend(msg as any, ((existing: ChatMessage) =>
            existing.role === "TOOL" &&
            existing.toolName === msg.toolName &&
            !existing.toolResult) as any,
          );
        } else {
          appendNode(msg as any);
        }
      },
      [isTask, appendNode, replaceOrAppend],
    ),
  );

  return { messages: messages as ChatMessage[], loading, hasMore, loadMore, loadingMore };
}
