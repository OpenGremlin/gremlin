import { useCallback, useEffect, useRef, useState } from "react";
import { gql } from "../../../auth";
import type { AgentLogsQuery } from "../../../graphql/generated/graphql";
import {
  AgentLogSubscription,
  AgentLogsQuery as AgentLogsDoc,
} from "../../../graphql/queries";
import { useSubscription } from "../../../useSubscription";

export type ChatMessage = AgentLogsQuery["agentLogs"]["edges"][number]["node"];

type AgentLogConnection = AgentLogsQuery["agentLogs"];

const PAGE_SIZE = 20;

export function useChatMessages(agentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const startCursorRef = useRef<string | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Initial load — fetch last N messages
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await gql<AgentLogsQuery>(AgentLogsDoc, {
          agentId,
          last: PAGE_SIZE,
        });
        if (cancelled) return;
        const edges = data.agentLogs.edges;
        setMessages(edges.map((e) => e.node));
        setHasMore(data.agentLogs.pageInfo.hasPreviousPage);
        startCursorRef.current = data.agentLogs.pageInfo.startCursor ?? null;
      } catch (err) {
        console.error("Failed to load agent logs:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  // Subscribe to new messages via SSE
  useSubscription(
    AgentLogSubscription,
    { agentId },
    useCallback((data) => {
      const msg = data.agentLogCreated;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

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
    }, []),
  );

  // Cleanup agent active timer
  useEffect(() => {
    return () => clearTimeout(activeTimerRef.current);
  }, []);

  // Load more (older) messages for infinite scroll
  const loadMore = useCallback(async () => {
    if (!startCursorRef.current || !hasMore) return;

    try {
      const data = await gql<AgentLogsQuery>(AgentLogsDoc, {
        agentId,
        last: PAGE_SIZE,
        before: startCursorRef.current,
      });
      const edges = data.agentLogs.edges;
      setMessages((prev) => [...edges.map((e) => e.node), ...prev]);
      setHasMore(data.agentLogs.pageInfo.hasPreviousPage);
      startCursorRef.current = data.agentLogs.pageInfo.startCursor ?? null;
    } catch (err) {
      console.error("Failed to load more messages:", err);
    }
  }, [agentId, hasMore]);

  return { messages, loading, hasMore, loadMore, isAgentActive };
}
