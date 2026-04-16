import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";
import {
  PendingInboxMessagesQuery,
  SendMessageMutation,
} from "../graphql/queries";
import { execute } from "../lib/apolloClient";
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
    if (process.env.EXPO_OS === "web") {
      listRef.current?.scrollToEnd({ animated: true });
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // Load pending inbox messages on mount (survives page reload)
  useEffect(() => {
    if (!agentId) return;
    execute(PendingInboxMessagesQuery, { agentId, taskId })
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

  const inputRef = useRef(input);
  inputRef.current = input;

  const handleSend = useCallback(async () => {
    // Read from ref so this works even if input state was eagerly cleared
    const content = inputRef.current.trim();
    if (!content || !agentId || sending) return;
    setSending(true);
    setSendError(null);
    setInput("");
    clientLogger.info("Sending message", { agentId, taskId });
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 15_000),
      );
      await Promise.race([
        execute(SendMessageMutation, {
          agentId,
          content,
          ...(taskId ? { taskId } : {}),
        }),
        timeout,
      ]);
      clientLogger.debug("Message sent successfully", { agentId, taskId });
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
      // Restore input on failure so user doesn't lose their message
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [agentId, taskId, sending, scrollToBottom]);

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
