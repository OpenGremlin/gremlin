import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AGENT_QUERY } from "../../../queries";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Agent } from "../../../types";
import { useQuery } from "../../../useQuery";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import type { LogEntry } from "./LogEntryView";
import { LogEntryView } from "./LogEntryView";

const MOCK_LOG: LogEntry[] = [
  {
    id: "turn-1",
    type: "status",
    text: "Agent became ACTIVE",
    timestamp: "9:00 AM",
  },
  {
    id: "turn-2",
    type: "user",
    text: "Hey, can you check if there are any new mentions of us on Twitter?",
    timestamp: "9:01 AM",
  },
  {
    id: "turn-3",
    type: "agent",
    text: "Sure! Let me search for recent mentions.",
    timestamp: "9:01 AM",
  },
  {
    id: "turn-4",
    type: "tool",
    label: "twitter.search_mentions",
    content:
      '$ twitter.search_mentions --query "gremlin"\nFound 3 new mentions in the last 24h\n- @alice: "Just tried gremlin, pretty cool!"\n- @bob: "Anyone used gremlin for monitoring?"\n- @carol: "gremlin saved my deploy today 🎉"',
    timestamp: "9:02 AM",
  },
  {
    id: "turn-5",
    type: "agent",
    text: "Found 3 new mentions! All positive sentiment. Alice is a new user giving praise, Bob is asking about monitoring use-cases, and Carol had a successful deploy. Want me to draft replies?",
    timestamp: "9:02 AM",
  },
  {
    id: "turn-6",
    type: "user",
    text: "Yes, draft a friendly reply to Alice",
    timestamp: "9:03 AM",
  },
  {
    id: "turn-7",
    type: "agent",
    text: 'How about: "Thanks for trying us out, Alice! Let us know if you have any questions — we\'re here to help!"',
    timestamp: "9:03 AM",
  },
  {
    id: "turn-8",
    type: "status",
    text: "Agent became IDLE",
    timestamp: "9:15 AM",
  },
];

export function AgentChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agent: Agent | null }>(
    AGENT_QUERY,
    { id },
  );
  const [input, setInput] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const handleSend = useCallback(() => setInput(""), []);

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
      <ChatHeader agent={agent} />

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {MOCK_LOG.map((entry) => (
          <LogEntryView key={entry.id} entry={entry} />
        ))}
        <div ref={logEndRef} />
      </div>

      <ChatInputBar value={input} onChange={setInput} onSend={handleSend} />
    </div>
  );
}
