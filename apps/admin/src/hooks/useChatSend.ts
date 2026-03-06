import { useCallback, useEffect, useRef, useState } from "react";
import { gql } from "../auth";
import { SendMessageMutation } from "../graphql/queries";
import { clientLogger } from "../logger";
import type { ChatMessage } from "./useLogMessages";

export function useChatSend({
  agentId,
  taskId,
  messages,
}: {
  agentId: string;
  taskId?: string;
  messages: ChatMessage[];
}) {
  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Clear pending messages when they appear in the log via subscription
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const userMessages = messages.filter((m) => m.role === "USER");
    setPendingMessages((prev) => {
      const next = prev.filter(
        (content) => !userMessages.some((m) => m.content === content),
      );
      return next.length === prev.length ? prev : next;
    });
  }, [messages, pendingMessages.length]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !agentId) return;
    setInput("");
    setPendingMessages((prev) => [...prev, content]);
    scrollToBottom();
    clientLogger.info("Sending message", { agentId, taskId });
    try {
      await gql(SendMessageMutation, {
        agentId,
        content,
        ...(taskId ? { taskId } : {}),
      });
      clientLogger.debug("Message sent successfully", { agentId, taskId });
    } catch (err) {
      clientLogger.error("Failed to send message", {
        agentId,
        taskId,
        error: err instanceof Error ? err.message : String(err),
      });
      setPendingMessages((prev) => prev.filter((m) => m !== content));
    }
  }, [input, agentId, taskId, scrollToBottom]);

  return {
    input,
    setInput,
    pendingMessages,
    scrollRef,
    scrollToBottom,
    handleSend,
  };
}
