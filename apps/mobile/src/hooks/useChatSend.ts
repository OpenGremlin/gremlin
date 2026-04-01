import { useCallback, useEffect, useRef, useState } from "react";
import { type FlatList, Platform } from "react-native";
import {
  PendingInboxMessagesQuery,
  SendMessageMutation,
} from "../graphql/queries";
import { mutate } from "../lib/apolloClient";
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
    // On web, the inverted FlatList scaleY(-1) workaround reverses scroll
    // semantics: offset 0 = visual top (oldest), large offset = visual bottom.
    const offset = Platform.OS === "web" ? 999999 : 0;
    listRef.current?.scrollToOffset({ offset, animated: true });
  }, []);

  // Load pending inbox messages on mount (survives page reload)
  useEffect(() => {
    if (!agentId) return;
    mutate(PendingInboxMessagesQuery, { agentId, taskId })
      .then((result) => {
        const contents = result.pendingInboxMessages.map((m) => m.content);
        if (contents.length > 0) {
          setPendingMessages((prev) => {
            const existing = new Set(prev);
            const merged = [
              ...prev,
              ...contents.filter((c) => !existing.has(c)),
            ];
            return merged.length === prev.length ? prev : merged;
          });
        }
      })
      .catch((err) => {
        clientLogger.error("Failed to load pending inbox messages", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }, [agentId, taskId]);

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

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !agentId || sending) return;
    setSending(true);
    setSendError(null);
    clientLogger.info("Sending message", { agentId, taskId });
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 15_000),
      );
      await Promise.race([
        mutate(SendMessageMutation, {
          agentId,
          content,
          ...(taskId ? { taskId } : {}),
        }),
        timeout,
      ]);
      clientLogger.debug("Message sent successfully", { agentId, taskId });
      setInput("");
      setPendingMessages((prev) => [...prev, content]);
      scrollToBottom();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      clientLogger.error("Failed to send message", {
        agentId,
        taskId,
        error: msg,
      });
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }, [input, agentId, taskId, sending, scrollToBottom]);

  return {
    input,
    setInput,
    pendingMessages,
    listRef,
    scrollToBottom,
    handleSend,
    sending,
    sendError,
    clearSendError: useCallback(() => setSendError(null), []),
  };
}
