import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gql } from "../../auth";
import type { TaskQuery as TaskQueryType } from "../../graphql/generated/graphql";
import {
  SendMessageMutation,
  TaskQuery,
  TaskUpdatedSubscription,
} from "../../graphql/queries";
import { useSandboxOutput } from "../../hooks/useSandboxOutput";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { NotFound, QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { useSubscription } from "../../useSubscription";
import { ChatInputBar } from "../AgentsTab/AgentChatPage/ChatInputBar";
import { LogEntryView } from "../AgentsTab/AgentChatPage/LogEntryView";
import { useTaskChatMessages } from "./useTaskChatMessages";

type Task = NonNullable<TaskQueryType["task"]>;

export function TaskThreadPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { data, loading, error } = useQuery(TaskQuery, { id: taskId ?? "" });

  const [task, setTask] = useState<Task | null>(null);

  // Sync initial query data
  useEffect(() => {
    if (data?.task) setTask(data.task);
  }, [data]);

  // Live-update task header
  useSubscription(
    TaskUpdatedSubscription,
    { taskId: taskId ?? "" },
    useCallback((update) => {
      setTask((prev) =>
        prev ? ({ ...prev, ...update.taskUpdated } as Task) : prev,
      );
    }, []),
  );

  const { messages, isAgentActive, hasMore, loadMore, loadingMore } =
    useTaskChatMessages(taskId ?? "");

  const sandboxStreams = useSandboxOutput(taskId ?? "");

  const docs = task?.documents ?? [];

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !task || !taskId || sending) return;
    setInput("");
    setSending(true);
    scrollToBottom();
    try {
      await gql(SendMessageMutation, {
        agentId: task.agent.id,
        content,
        taskId,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [input, task, taskId, sending, scrollToBottom]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  if (!task) {
    return <NotFound label="Task not found." />;
  }

  const chatMessages = messages;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm px-3 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/agents/${task.agent.id}`}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <AgentAvatar id={task.agent.id} />
          <h1 className="text-sm font-semibold text-neutral-100 flex-1 truncate">
            {task.title}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse"
      >
        <div>
          <div className="px-3 pt-4 pb-3">

            {/* Load older messages */}
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mb-2 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-1"
              >
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            )}

            {/* Log entries */}
            <div className="flex flex-col gap-1">
              {chatMessages.map((msg, i) => (
                <LogEntryView
                  key={msg.id}
                  entry={msg}
                  isLast={i === chatMessages.length - 1}
                  documents={docs}
                  sandboxStreams={sandboxStreams}
                />
              ))}
              {isAgentActive && (
                <div className="flex justify-start py-1">
                  <div className="bg-neutral-800 text-neutral-400 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
