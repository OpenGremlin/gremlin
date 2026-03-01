import { Code } from "lucide-react";

export type LogEntry =
  | { id: string; type: "user"; text: string; timestamp: string }
  | { id: string; type: "agent"; text: string; timestamp: string }
  | { id: string; type: "status"; text: string; timestamp: string }
  | {
      id: string;
      type: "tool";
      label: string;
      content: string;
      timestamp: string;
    };

export const MOCK_LOG: LogEntry[] = [
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
    text: 'How about: "Thanks for trying us out, Alice! 🙌 Let us know if you have any questions — we\'re here to help!"',
    timestamp: "9:03 AM",
  },
  {
    id: "turn-8",
    type: "status",
    text: "Agent became IDLE",
    timestamp: "9:15 AM",
  },
];

export function LogEntryView({ entry }: { entry: LogEntry }) {
  switch (entry.type) {
    case "status":
      return (
        <div id={entry.id} className="flex justify-center py-2">
          <span className="text-xs text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full">
            {entry.text} · {entry.timestamp}
          </span>
        </div>
      );
    case "user":
      return (
        <div id={entry.id} className="flex justify-end py-1">
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
        <div id={entry.id} className="flex justify-start py-1">
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
        <div id={entry.id} className="py-1 px-2">
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
