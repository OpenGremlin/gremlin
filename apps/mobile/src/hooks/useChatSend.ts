import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";
import { SendMessageMutation } from "../graphql/queries";
import { gql } from "../lib/auth";
import { clientLogger } from "../lib/logger";
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
  const listRef = useRef<FlatList>(null);
  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Clear pending messages when they appear in the log
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const userContents = new Set(
      messages.filter((m) => m.role === "USER").map((m) => m.content),
    );
    setPendingMessages((prev) => {
      const next = prev.filter((content) => !userContents.has(content));
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
    listRef,
    scrollToBottom,
    handleSend,
  };
}
