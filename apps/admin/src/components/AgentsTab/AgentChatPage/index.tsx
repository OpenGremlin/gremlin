import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentQuery, TaskQuery } from "../../../graphql/queries";
import { useChatSend } from "../../../hooks/useChatSend";
import { useLogMessages } from "../../../hooks/useLogMessages";
import { useSandboxOutput } from "../../../hooks/useSandboxOutput";
import { PendingMessageBubble } from "../../../shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { shouldShowTimestamp } from "../../../hooks/useLogMessages";
import { LogEntryView } from "./LogEntryView";

export function AgentChatPage() {
  const { id, taskId } = useParams<{ id: string; taskId?: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(AgentQuery, { id: id ?? "" });

  const agentChat = useLogMessages({ agentId: id ?? "" });
  const taskChat = useLogMessages({ taskId: taskId ?? "" });

  const { data: taskData } = useQuery(TaskQuery, { id: taskId ?? "" });
  const taskDocs = taskData?.task?.documents ?? [];

  const isTaskView = !!taskId;
  const chat = isTaskView ? taskChat : agentChat;
  const sandboxStreams = useSandboxOutput(taskId ?? "");

  const { input, setInput, pendingMessages, scrollRef, handleSend } =
    useChatSend({
      agentId: id ?? "",
      taskId,
      messages: chat.messages,
    });

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !chat.hasMore) return;
    if (el.scrollTop < 50) {
      chat.loadMore();
    }
  }, [chat.hasMore, chat.loadMore, scrollRef]);

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
        ref={scrollRef}
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
          {filteredMessages.map((msg, i) => (
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
              showTimestamp={shouldShowTimestamp(msg, filteredMessages[i + 1])}
            />
          ))}
          {pendingMessages.map((content) => (
            <PendingMessageBubble key={content} content={content} />
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
