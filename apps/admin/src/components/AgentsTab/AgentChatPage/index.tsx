import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AGENT_QUERY } from "../../../queries";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { Agent } from "../../../types";
import { useQuery } from "../../../useQuery";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { LogEntryView, MOCK_LOG } from "./LogEntryView";

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
      <ChatHeader agent={agent} />

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {MOCK_LOG.map((entry) => (
          <LogEntryView key={entry.id} entry={entry} />
        ))}
        <div ref={logEndRef} />
      </div>

      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={() => setInput("")}
      />
    </div>
  );
}
