import { useSubscription } from "@apollo/client";
import { useCallback, useRef, useState } from "react";
import { AgentStreamSubscription as AgentStreamDoc } from "../graphql/queries";

export interface StreamingMessage {
  logId: string;
  taskId: string | null;
  content: string;
  reasoning: string;
  /** Timestamp (ms) when the first reasoning delta arrived. */
  reasoningStartedAt: number | null;
  /** Timestamp (ms) when reasoning finished (first text delta arrived). */
  reasoningEndedAt: number | null;
}

/**
 * Subscribe to agent text-stream deltas and accumulate into a
 * StreamingMessage. Returns null when the agent is not streaming.
 *
 * The streaming bubble stays visible until `dismiss(logId)` is called —
 * typically when `useLogMessages` receives the final log entry with the
 * same ID, preventing a flicker between stream-end and log-arrival.
 *
 * When dismissed, `lastReasoning` retains the reasoning text so the
 * final log bubble can still display it even though it's not persisted.
 */
export function useAgentStream(
  agentId: string,
  taskId?: string | null,
): {
  streaming: StreamingMessage | null;
  /** Reasoning from the most recently completed stream, keyed by logId. */
  lastReasoning: { logId: string; text: string; elapsedMs: number } | null;
  dismiss: (logId: string) => void;
} {
  const [streaming, setStreaming] = useState<StreamingMessage | null>(null);
  const [lastReasoning, setLastReasoning] = useState<{
    logId: string;
    text: string;
    elapsedMs: number;
  } | null>(null);

  const textBufferRef = useRef("");
  const reasoningBufferRef = useRef("");
  const reasoningStartRef = useRef<number | null>(null);
  const reasoningEndRef = useRef<number | null>(null);
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
        // If there's accumulated content, keep the bubble visible until
        // the final log entry arrives and dismiss() is called.
        // If there's no content (e.g. turn ended on backgroundTask with
        // no text), clear the bubble immediately — no log entry will come.
        if (!textBufferRef.current && !reasoningBufferRef.current) {
          textBufferRef.current = "";
          reasoningBufferRef.current = "";
          reasoningStartRef.current = null;
          reasoningEndRef.current = null;
          setStreaming(null);
        }
        return;
      }

      if (event.kind === "reasoning") {
        // Track when reasoning started
        if (reasoningStartRef.current === null) {
          reasoningStartRef.current = Date.now();
        }
        reasoningBufferRef.current += event.delta;
      } else {
        // First text delta marks the end of reasoning
        if (
          reasoningStartRef.current !== null &&
          reasoningEndRef.current === null
        ) {
          reasoningEndRef.current = Date.now();
        }
        textBufferRef.current += event.delta;
      }

      setStreaming({
        logId: event.logId,
        taskId: event.taskId ?? null,
        content: textBufferRef.current,
        reasoning: reasoningBufferRef.current,
        reasoningStartedAt: reasoningStartRef.current,
        reasoningEndedAt: reasoningEndRef.current,
      });
    },
  });

  const dismiss = useCallback((logId: string) => {
    setStreaming((prev) => {
      if (prev?.logId === logId) {
        // Preserve reasoning for the final log bubble
        if (prev.reasoning) {
          const elapsed =
            prev.reasoningEndedAt && prev.reasoningStartedAt
              ? prev.reasoningEndedAt - prev.reasoningStartedAt
              : 0;
          setLastReasoning({
            logId,
            text: prev.reasoning,
            elapsedMs: elapsed,
          });
        }
        textBufferRef.current = "";
        reasoningBufferRef.current = "";
        reasoningStartRef.current = null;
        reasoningEndRef.current = null;
        return null;
      }
      return prev;
    });
  }, []);

  return { streaming, lastReasoning, dismiss };
}
