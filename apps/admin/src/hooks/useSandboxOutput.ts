import { useCallback, useRef, useState } from "react";
import { SandboxOutputSubscription } from "../graphql/queries/tasks";
import { clientLogger } from "../logger";
import { useSubscription } from "./useSubscription";

interface SandboxOutputChunk {
  commandId: string;
  stream: "stdout" | "stderr";
  data: string;
  done?: boolean;
  exitCode?: number;
}

export interface CommandStream {
  output: string;
  done: boolean;
  exitCode?: number;
}

/**
 * Subscribe to live sandbox output for a task.
 * Returns a map of commandId → accumulated output.
 * Triggers re-renders on each incoming chunk.
 */
export function useSandboxOutput(taskId: string) {
  const streamsRef = useRef(new Map<string, CommandStream>());
  const [, setVersion] = useState(0);

  useSubscription<{ sandboxOutput: SandboxOutputChunk }>(
    SandboxOutputSubscription,
    { taskId },
    useCallback((data: { sandboxOutput: SandboxOutputChunk }) => {
      const chunk = data.sandboxOutput;
      const existing = streamsRef.current.get(chunk.commandId) ?? {
        output: "",
        done: false,
      };

      if (chunk.done) {
        existing.done = true;
        existing.exitCode = chunk.exitCode;
        clientLogger.debug("Sandbox command completed", {
          commandId: chunk.commandId,
          exitCode: chunk.exitCode,
        });
      } else {
        existing.output += chunk.data;
      }

      streamsRef.current.set(chunk.commandId, existing);
      setVersion((v) => v + 1);
    }, []),
  );

  return streamsRef.current;
}
