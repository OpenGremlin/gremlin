import { useSubscription } from "@apollo/client";
import { useCallback, useRef, useState } from "react";
import { AgentStreamSubscription as AgentStreamDoc } from "../graphql/queries";

export interface StreamingMessage {
  logId: string;
  taskId: string | null;
  content: string;
}

/**
 * Subscribe to agent text-stream deltas and accumulate into a
 * StreamingMessage. Returns null when the agent is not streaming.
 *
 * The streaming bubble stays visible until `dismiss(logId)` is called —
 * typically when `useLogMessages` receives the final log entry with the
 * same ID, preventing a flicker between stream-end and log-arrival.
 */
export function useAgentStream(
  agentId: string,
  taskId?: string | null,
): {
  streaming: StreamingMessage | null;
  dismiss: (logId: string) => void;
} {
  const [streaming, setStreaming] = useState<StreamingMessage | null>(null);
  const bufferRef = useRef("");
  const taskIdRef = useRef(taskId);
  taskIdRef.current = taskId;

  useSubscription(AgentStreamDoc, {
    variables: { agentId },
    onData: ({ data: { data } }) => {
      if (!data) return;
      const event = data.agentStream;

      // Filter by taskId if provided
      if (taskIdRef.current !== undefined) {
        if (event.taskId !== taskIdRef.current) return;
      }

      if (event.done) {
        // Mark the content as final but keep the bubble visible.
        // It will be dismissed when the log entry arrives.
        return;
      }

      // Accumulate text
      bufferRef.current += event.delta;
      setStreaming({
        logId: event.logId,
        taskId: event.taskId ?? null,
        content: bufferRef.current,
      });
    },
  });

  const dismiss = useCallback((logId: string) => {
    setStreaming((prev) => {
      if (prev?.logId === logId) {
        bufferRef.current = "";
        return null;
      }
      return prev;
    });
  }, []);

  return { streaming, dismiss };
}
