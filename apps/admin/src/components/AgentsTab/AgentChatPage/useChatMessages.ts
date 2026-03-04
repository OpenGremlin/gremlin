import { useCallback, useEffect, useRef, useState } from "react";
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
  } = usePaginatedQuery(AgentLogsDoc, (d) => d.agentLogs, { agentId });

  const [isAgentActive, setIsAgentActive] = useState(false);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Subscribe to new messages via WebSocket
  useSubscription(
    AgentLogSubscription,
    { agentId },
    useCallback(
      (data) => {
        const msg = data.agentLogCreated;
        appendNode(msg);

        // TOOL messages (status updates) mean the agent is mid-turn.
        // AGENT messages mean the turn is complete.
        if (msg.role === "TOOL") {
          setIsAgentActive(true);
          clearTimeout(activeTimerRef.current);
        } else if (msg.role === "AGENT") {
          setIsAgentActive(false);
          clearTimeout(activeTimerRef.current);
        }
      },
      [appendNode],
    ),
  );

  // Cleanup agent active timer
  useEffect(() => {
    return () => clearTimeout(activeTimerRef.current);
  }, []);

  return { messages, loading, hasMore, loadMore, isAgentActive, appendNode };
}
