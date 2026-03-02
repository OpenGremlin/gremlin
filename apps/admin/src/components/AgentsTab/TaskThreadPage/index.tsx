import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  TASK_QUERY,
  SEND_MESSAGE_MUTATION,
  TASK_UPDATED_SUBSCRIPTION,
} from "../../../queries";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { Badge } from "../../../shared/Badge";
import type { Task } from "../../../types";
import { useQuery } from "../../../useQuery";
import { useSubscription } from "../../../useSubscription";
import { ChatInputBar } from "../AgentChatPage/ChatInputBar";
import { LogEntryView } from "../AgentChatPage/LogEntryView";
import { DocumentCard } from "./DocumentCard";
import { useTaskChatMessages } from "./useTaskChatMessages";

type Tab = "output" | "activity";

export function TaskThreadPage() {
  const { id: agentId, taskId } = useParams<{ id: string; taskId: string }>();
  const { data, loading, error } = useQuery<{ task: Task | null }>(
    TASK_QUERY,
    { id: taskId },
  );

  const [task, setTask] = useState<Task | null>(null);

  // Sync initial query data
  useEffect(() => {
    if (data?.task) setTask(data.task);
  }, [data]);

  // Live-update task header
  useSubscription<{ taskUpdated: Partial<Task> & { id: string } }>(
    TASK_UPDATED_SUBSCRIPTION,
    { taskId: taskId! },
    useCallback((update) => {
      setTask((prev) => (prev ? { ...prev, ...update.taskUpdated } : prev));
    }, []),
  );

  const logEdges = data?.task?.logs?.edges ?? [];
  const { messages, isAgentActive } = useTaskChatMessages(taskId!, logEdges);

  const docs = task?.documents ?? [];
  const hasDocs = docs.length > 0;
  const [tab, setTab] = useState<Tab>(hasDocs ? "output" : "activity");

  // Switch to output tab when first doc arrives
  useEffect(() => {
    if (hasDocs && tab === "activity") setTab("output");
  }, [hasDocs]); // eslint-disable-line react-hooks/exhaustive-deps

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (tab !== "activity") return;
    if (messages.length > prevMessageCountRef.current) {
      const isInitialLoad = prevMessageCountRef.current === 0;
      logEndRef.current?.scrollIntoView({
        behavior: isInitialLoad ? "instant" : "smooth",
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, tab]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !agentId || !taskId || sending) return;
    setInput("");
    setSending(true);
    try {
      await gql(SEND_MESSAGE_MUTATION, {
        agentId,
        content,
        taskId,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [input, agentId, taskId, sending]);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  if (!task) {
    return <NotFound label="Task not found." />;
  }

  // Separate system prompt from chat messages
  const systemMsg = messages.find((m) => m.role === "SYSTEM");
  const chatMessages = messages.filter((m) => m.role !== "SYSTEM");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm px-3 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/agents/${agentId}`}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold text-neutral-100 flex-1 truncate">
            {task.title}
          </h1>
          <Badge label={task.status} />
        </div>

        {/* Task prompt */}
        {systemMsg && (
          <p className="text-xs text-neutral-500 mt-2 ml-6 line-clamp-2">
            {systemMsg.content}
          </p>
        )}

        {/* Tabs */}
        {hasDocs && (
          <div className="flex gap-1.5 mt-3 ml-6">
            <button
              type="button"
              onClick={() => setTab("output")}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                tab === "output"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "bg-neutral-800/60 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Output
            </button>
            <button
              type="button"
              onClick={() => setTab("activity")}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                tab === "activity"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "bg-neutral-800/60 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Activity
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      {tab === "output" ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
            {chatMessages.map((msg, i) => (
              <LogEntryView
                key={msg.id}
                entry={msg}
                isLast={i === chatMessages.length - 1}
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
        </>
      )}
    </div>
  );
}
