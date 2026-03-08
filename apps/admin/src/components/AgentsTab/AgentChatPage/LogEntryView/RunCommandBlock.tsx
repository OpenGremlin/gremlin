import { Loader2 } from "lucide-react";
import type { ChatMessage } from "../../../../hooks/useLogMessages";
import type { CommandStream } from "../../../../hooks/useSandboxOutput";
import { SandboxOutputBlock } from "./SandboxOutputBlock";
import { ToolBlock } from "./ToolBlock";

export function RunCommandBlock({
  entry,
  tool,
  sandboxStreams,
  showTimestamp,
}: {
  entry: ChatMessage;
  tool: {
    name: string;
    input: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
  };
  sandboxStreams?: Map<string, CommandStream>;
  showTimestamp: boolean;
}) {
  const commandId = (tool.result?.commandId ?? tool.input?.commandId) as
    | string
    | undefined;
  const command = tool.input?.command as string | undefined;
  const hasResult = !!tool.result;
  const output = (tool.result?.output as string) ?? "";
  const exitCode = tool.result?.exitCode as number | undefined;

  // Match stream: by commandId if available, otherwise use the latest active stream
  let stream = commandId ? sandboxStreams?.get(commandId) : undefined;
  if (!hasResult && !stream && sandboxStreams) {
    for (const [, s] of sandboxStreams) {
      if (!s.done) stream = s;
    }
  }
  const isStreaming = !hasResult && stream && !stream.done;

  if (!hasResult) {
    return (
      <ToolBlock
        id={entry.id}
        label={
          <>
            runCommand(
            <span className="font-normal text-neutral-400 break-all">
              $ {command ?? "…"}
            </span>
            )
          </>
        }
        content=""
        createdAt={entry.createdAt}
        showTimestamp={showTimestamp}
        badges={
          isStreaming ? (
            <Loader2 size={10} className="animate-spin text-neutral-500" />
          ) : undefined
        }
      >
        <SandboxOutputBlock
          commandId={commandId ?? "pending"}
          stream={stream}
        />
      </ToolBlock>
    );
  }

  return (
    <ToolBlock
      id={entry.id}
      label={
        <>
          runCommand(
          <span className="font-normal text-neutral-400 break-all">
            $ {command ?? "…"}
          </span>
          )
          {exitCode !== undefined && exitCode !== 0 && (
            <span className="font-normal text-red-400/70 text-[10px] ml-1">
              exit {exitCode}
            </span>
          )}
        </>
      }
      content={output || "(no output)"}
      createdAt={entry.createdAt}
      showTimestamp={showTimestamp}
    />
  );
}
