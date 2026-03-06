import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import { AgentQuery, SendMessageMutation, TaskQuery } from "../../../graphql/queries";
import { useSandboxOutput } from "../../../hooks/useSandboxOutput";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { useTaskChatMessages } from "../../TaskThreadPage/useTaskChatMessages";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { LogEntryView } from "./LogEntryView";
import { useChatMessages } from "./useChatMessages";

export function AgentChatPage() {
  const { id, taskId } = useParams<{ id: string; taskId?: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(AgentQuery, { id: id ?? "" });

  const agentChat = useChatMessages(id ?? "");
  const taskChat = useTaskChatMessages(taskId ?? "");

  const { data: taskData } = useQuery(TaskQuery, { id: taskId ?? "" });
  const taskDocs = taskData?.task?.documents ?? [];

  const isTaskView = !!taskId;
  const chat = isTaskView ? taskChat : agentChat;
  const sandboxStreams = useSandboxOutput(taskId ?? "");

  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !chat.hasMore) return;
    if (el.scrollTop < 50) {
      chat.loadMore();
    }
  }, [chat.hasMore, chat.loadMore]);

  // Clear pending messages when they appear in the log via subscription
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const userMessages = chat.messages.filter((m) => m.role === "USER");
    setPendingMessages((prev) =>
      prev.filter(
        (content) => !userMessages.some((m) => m.content === content),
      ),
    );
  }, [chat.messages, pendingMessages.length]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !id) return;
    setInput("");
    setPendingMessages((prev) => [...prev, content]);
    scrollToBottom();
    try {
      await gql(SendMessageMutation, {
        agentId: id,
        content,
        ...(taskId ? { taskId } : {}),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setPendingMessages((prev) => prev.filter((m) => m !== content));
    }
  }, [input, id, taskId, scrollToBottom]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  const filteredMessages = isTaskView
    ? chat.messages
    : chat.messages.filter((msg) => !msg.taskId);

  return (
    <div className="relative h-full">
      <ChatHeader agent={agent} taskId={taskId} />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`absolute inset-0 overflow-y-auto px-3 pb-16 flex flex-col-reverse ${isTaskView ? "pt-44" : "pt-32"}`}
      >
        <div className="flex flex-col gap-1">
          {chat.hasMore && (
            <button
              type="button"
              onClick={chat.loadMore}
              className="text-xs text-neutral-500 hover:text-neutral-300 self-center py-2"
            >
              Load older messages
            </button>
          )}
          {chat.loading && chat.messages.length === 0 && (
            <div className="text-xs text-neutral-500 self-center py-4">
              Loading...
            </div>
          )}
          {filteredMessages.map((msg) => (
            <LogEntryView
              key={msg.id}
              entry={msg}
              onTaskClick={
                isTaskView
                  ? undefined
                  : (tid) => navigate(`/agents/${id}/tasks/${tid}`)
              }
              documents={isTaskView ? taskDocs : undefined}
              sandboxStreams={isTaskView ? sandboxStreams : undefined}
            />
          ))}
          {/* Pending messages — shown inline at the bottom of the chat */}
          {pendingMessages.map((content) => (
            <div key={content} className="flex justify-end py-1">
              <div className="max-w-[80%] flex items-start gap-2">
                <div className="text-white/60 text-sm px-3.5 py-2 rounded-2xl rounded-br-md bg-blue-600/40 border border-blue-500/20">
                  {content}
                </div>
                <Loader2 size={14} className="animate-spin text-blue-400 shrink-0 mt-2.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {agent.retired ? (
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-800/60 bg-neutral-950/70 backdrop-blur-md px-3 py-3.5">
          <div className="text-center text-sm text-neutral-500">
            This agent is retired.
          </div>
        </div>
      ) : (
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
