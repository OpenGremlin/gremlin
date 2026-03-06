import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CommandStream } from "../../../../hooks/useSandboxOutput";

export function SandboxOutputBlock({
  commandId,
  stream,
}: {
  commandId: string;
  stream: CommandStream | undefined;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [stream?.output]);

  if (!stream || (!stream.output && !stream.done)) return null;

  return (
    <div className="mt-1 mb-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="max-h-[200px] overflow-y-auto">
        <pre className="text-xs font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed text-green-400/90">
          {stream.output || "(no output)"}
          <div ref={bottomRef} />
        </pre>
      </div>
      {!stream.done && (
        <div className="flex items-center gap-1.5 px-3 py-1 border-t border-neutral-800/50 text-[10px] text-neutral-500">
          <Loader2 size={10} className="animate-spin" />
          <span>Running...</span>
        </div>
      )}
      {stream.done && stream.exitCode !== undefined && stream.exitCode !== 0 && (
        <div className="px-3 py-1 border-t border-neutral-800/50 text-[10px] text-red-400/70">
          exit code {stream.exitCode}
        </div>
      )}
    </div>
  );
}
