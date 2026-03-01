import { useParams, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Code, ArrowRight } from "lucide-react";
import type { Agent } from "../../types";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { Badge } from "../../shared/Badge";
import { QueryResult, NotFound } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENT_QUERY } from "../../queries";

type LogEntry =
  | { type: "user"; text: string; timestamp: string }
  | { type: "agent"; text: string; timestamp: string }
  | { type: "status"; text: string; timestamp: string }
  | { type: "tool"; label: string; content: string; timestamp: string };

const MOCK_LOG: LogEntry[] = [
  { type: "status", text: "Agent became ACTIVE", timestamp: "9:00 AM" },
  {
    type: "user",
    text: "Hey, can you check if there are any new mentions of us on Twitter?",
    timestamp: "9:01 AM",
  },
  {
    type: "agent",
    text: "Sure! Let me search for recent mentions.",
    timestamp: "9:01 AM",
  },
  {
    type: "tool",
    label: "twitter.search_mentions",
    content:
      '$ twitter.search_mentions --query "gremlin"\nFound 3 new mentions in the last 24h\n- @alice: "Just tried gremlin, pretty cool!"\n- @bob: "Anyone used gremlin for monitoring?"\n- @carol: "gremlin saved my deploy today 🎉"',
    timestamp: "9:02 AM",
  },
  {
    type: "agent",
    text: "Found 3 new mentions! All positive sentiment. Alice is a new user giving praise, Bob is asking about monitoring use-cases, and Carol had a successful deploy. Want me to draft replies?",
    timestamp: "9:02 AM",
  },
  {
    type: "user",
    text: "Yes, draft a friendly reply to Alice",
    timestamp: "9:03 AM",
  },
  {
    type: "agent",
    text: 'How about: "Thanks for trying us out, Alice! 🙌 Let us know if you have any questions — we\'re here to help!"',
    timestamp: "9:03 AM",
  },
  { type: "status", text: "Agent became IDLE", timestamp: "9:15 AM" },
];

function LogEntryView({ entry }: { entry: LogEntry }) {
  switch (entry.type) {
    case "status":
      return (
        <div className="flex justify-center py-2">
          <span className="text-xs text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full">
            {entry.text} · {entry.timestamp}
          </span>
        </div>
      );
    case "user":
      return (
        <div className="flex justify-end py-1">
          <div className="max-w-[80%]">
            <div className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md">
              {entry.text}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 text-right pr-1">
              {entry.timestamp}
            </div>
          </div>
        </div>
      );
    case "agent":
      return (
        <div className="flex justify-start py-1">
          <div className="max-w-[80%]">
            <div className="bg-neutral-800 text-neutral-100 text-sm px-3.5 py-2 rounded-2xl rounded-bl-md">
              {entry.text}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 pl-1">
              {entry.timestamp}
            </div>
          </div>
        </div>
      );
    case "tool":
      return (
        <div className="py-1 px-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/50">
              <Code size={12} className="text-neutral-500 shrink-0" />
              <span className="text-[11px] text-neutral-400 font-mono">
                {entry.label}
              </span>
              <span className="text-[10px] text-neutral-600 ml-auto">
                {entry.timestamp}
              </span>
            </div>
            <pre className="text-xs text-green-400/90 font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </pre>
          </div>
        </div>
      );
  }
}

export function AgentChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );
  const [input, setInput] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const agent = data?.agent ?? null;

  if (!agent) {
    return <NotFound label="Agent not found." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pt-4 pb-3 flex flex-col items-center border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm shrink-0">
        <Link to={`/agents/${agent.id}/config`}>
          <AgentAvatar src={agent.imageUrl} name={agent.name} status={agent.status} size="lg" />
        </Link>
        <h1 className="text-sm font-semibold text-neutral-100 mt-2">
          {agent.name}
        </h1>
        <div className="mt-0.5">
          <Badge label={agent.status} />
        </div>
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {MOCK_LOG.map((entry, i) => (
          <LogEntryView key={i} entry={entry} />
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message…"
            className="flex-1 bg-neutral-800 text-sm text-neutral-100 rounded-full px-4 py-2 outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setInput("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => setInput("")}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-500 transition-colors"
          >
            <ArrowRight size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
