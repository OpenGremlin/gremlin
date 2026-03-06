import { useCallback, useRef, useSyncExternalStore } from "react";
import { SandboxOutputSubscription } from "../graphql/queries/tasks";
import { useSubscription } from "../useSubscription";

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
 */
export function useSandboxOutput(taskId: string) {
  const streamsRef = useRef(new Map<string, CommandStream>());
  const versionRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);

  useSyncExternalStore(subscribe, getSnapshot);

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
      } else {
        existing.output += chunk.data;
      }

      streamsRef.current.set(chunk.commandId, existing);
      versionRef.current++;
      for (const listener of listenersRef.current) listener();
    }, []),
  );

  return streamsRef.current;
}
