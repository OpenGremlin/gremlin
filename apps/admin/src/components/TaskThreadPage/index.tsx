import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TaskQuery as TaskQueryType } from "../../graphql/generated/graphql";
import { TaskQuery, TaskUpdatedSubscription } from "../../graphql/queries";
import { useChatSend } from "../../hooks/useChatSend";
import {
  shouldShowTimestamp,
  useLogMessages,
} from "../../hooks/useLogMessages";
import { useSandboxOutput } from "../../hooks/useSandboxOutput";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { PendingMessageBubble } from "../../shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { useSubscription } from "../../useSubscription";
import { ChatInputBar } from "../AgentsTab/AgentChatPage/ChatInputBar";
import { LogEntryView } from "../AgentsTab/AgentChatPage/LogEntryView";

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

  const { messages, hasMore, loadMore, loadingMore } = useLogMessages({
    taskId: taskId ?? "",
  });

  const sandboxStreams = useSandboxOutput(taskId ?? "");

  const docs = task?.documents ?? [];

  const { input, setInput, pendingMessages, scrollRef, handleSend } =
    useChatSend({
      agentId: task?.agent.id ?? "",
      taskId,
      messages,
    });

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  if (!task) {
    return <NotFound label="Task not found." />;
  }

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
              {messages.map((msg, i) => (
                <LogEntryView
                  key={msg.id}
                  entry={msg}
                  documents={docs}
                  sandboxStreams={sandboxStreams}
                  showTimestamp={shouldShowTimestamp(msg, messages[i + 1])}
                />
              ))}
              {pendingMessages.map((content) => (
                <PendingMessageBubble key={content} content={content} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ChatInputBar value={input} onChange={setInput} onSend={handleSend} />
    </div>
  );
}
