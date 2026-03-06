import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CommandStream } from "../../../../hooks/useSandboxOutput";

export function SandboxOutputBlock({
  stream,
}: {
  commandId?: string;
  stream: CommandStream | undefined;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const output = stream?.output;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new output
  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [output]);

  if (!stream || (!stream.output && !stream.done)) return null;

  return (
    <div className="mt-1 mb-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      <pre
        ref={preRef}
        className="text-xs font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed text-green-400/90 overflow-y-auto"
        style={{ maxHeight: `${3 * 1.5 + 1}em` }}
      >
        {stream.output || "(no output)"}
      </pre>
      {!stream.done && (
        <div className="flex items-center gap-1.5 px-3 py-1 border-t border-neutral-800/50 text-[10px] text-neutral-500">
          <Loader2 size={10} className="animate-spin" />
          <span>Running...</span>
        </div>
      )}
      {stream.done &&
        stream.exitCode !== undefined &&
        stream.exitCode !== 0 && (
          <div className="px-3 py-1 border-t border-neutral-800/50 text-[10px] text-red-400/70">
            exit code {stream.exitCode}
          </div>
        )}
    </div>
  );
}
