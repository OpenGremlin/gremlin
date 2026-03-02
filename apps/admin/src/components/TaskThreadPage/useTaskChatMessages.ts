import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskQuery } from "../../graphql/generated/graphql";
import { TaskLogSubscription } from "../../graphql/queries";
import { useSubscription } from "../../useSubscription";
import type { ChatMessage } from "../AgentsTab/AgentChatPage/useChatMessages";

type LogEdge = TaskQuery["task"] extends infer T
  ? T extends { logs: { edges: infer E } }
    ? E extends Array<infer Edge>
      ? Edge
      : never
    : never
  : never;

export function useTaskChatMessages(taskId: string, initialLogs: LogEdge[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialLogs.map((e) => e.node),
  );
  const [isAgentActive, setIsAgentActive] = useState(false);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Reset when taskId or initialLogs change
  useEffect(() => {
    if (initialLogs.length > 0) {
      setMessages(initialLogs.map((e) => e.node));
    }
  }, [taskId, initialLogs]);

  // Subscribe to new messages via SSE
  useSubscription(
    TaskLogSubscription,
    { taskId },
    useCallback((data) => {
      const msg = data.taskLogCreated;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

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

  return { messages, isAgentActive, hasMore: false, loadMore: () => {} };
}
