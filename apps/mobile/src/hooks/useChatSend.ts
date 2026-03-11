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
  /** Track whether user is near the bottom of the list (inverted: offset near 0). */
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  /** Call from FlatList onScroll to track proximity to bottom. */
  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      // In an inverted FlatList, offset 0 = bottom. Near bottom if < 150px away.
      isNearBottomRef.current = e.nativeEvent.contentOffset.y < 150;
    },
    [],
  );

  // Auto-scroll when new messages arrive only if user is near bottom
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCountRef.current && isNearBottomRef.current) {
      scrollToBottom();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Clear pending messages when they appear in the log
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
    listRef,
    scrollToBottom,
    handleScroll,
    handleSend,
  };
}
