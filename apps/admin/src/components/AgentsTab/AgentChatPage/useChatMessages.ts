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
  const { nodes: messages, loading, hasMore, loadMore, appendNode } =
    usePaginatedQuery(AgentLogsDoc, (d) => d.agentLogs, { agentId });

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

        // Mark agent as active when we receive an agent message,
        // and reset after a timeout of inactivity
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

  return { messages, loading, hasMore, loadMore, isAgentActive };
}
