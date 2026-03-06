import { useCallback } from "react";
import type { AgentLogsQuery } from "../../../graphql/generated/graphql";
import {
  AgentLogSubscription,
  AgentLogsQuery as AgentLogsDoc,
} from "../../../graphql/queries";
import { usePaginatedQuery } from "../../../usePaginatedQuery";
import { useSubscription } from "../../../useSubscription";

export type ChatMessage = AgentLogsQuery["agentLogs"]["edges"][number]["node"];

export function useChatMessages(agentId: string) {
  const {
    nodes: messages,
    loading,
    hasMore,
    loadMore,
    appendNode,
    replaceOrAppend,
  } = usePaginatedQuery(AgentLogsDoc, (d) => d.agentLogs, { agentId });

  // Subscribe to new messages via WebSocket
  useSubscription(
    AgentLogSubscription,
    { agentId },
    useCallback(
      (data) => {
        const msg = data.agentLogCreated;

        // TOOL entries with a result replace the matching call-only entry
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

  return { messages, loading, hasMore, loadMore };
}
