import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import { AGENT_QUERY, SEND_MESSAGE_MUTATION } from "../../../queries";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Agent } from "../../../types";
import { useQuery } from "../../../useQuery";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { LogEntryView } from "./LogEntryView";
import { useChatMessages } from "./useChatMessages";

export function AgentChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );
  const {
    messages,
    loading: messagesLoading,
    hasMore,
    loadMore,
    isAgentActive,
  } = useChatMessages(id!);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages (instant on first load, smooth after)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const isInitialLoad = prevMessageCountRef.current === 0;
      logEndRef.current?.scrollIntoView({
        behavior: isInitialLoad ? "instant" : "smooth",
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Infinite scroll — load older messages on scroll to top
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop < 50) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !id || sending) return;
    setInput("");
    setSending(true);
    try {
      await gql(SEND_MESSAGE_MUTATION, { agentId: id, content });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [input, id, sending]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader agent={agent} />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1"
      >
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            className="text-xs text-neutral-500 hover:text-neutral-300 self-center py-2"
          >
            Load older messages
          </button>
        )}
        {messagesLoading && messages.length === 0 && (
          <div className="text-xs text-neutral-500 self-center py-4">
            Loading...
          </div>
        )}
        {messages
          .filter((msg) => !msg.taskId)
          .map((msg) => (
            <LogEntryView
              key={msg.id}
              entry={msg}
              onTaskClick={(taskId) =>
                navigate(`/agents/${id}/tasks/${taskId}`)
              }
            />
          ))}
        {isAgentActive && (
          <div className="flex justify-start py-1">
            <div className="bg-neutral-800 text-neutral-400 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={sending}
      />
    </div>
  );
}
