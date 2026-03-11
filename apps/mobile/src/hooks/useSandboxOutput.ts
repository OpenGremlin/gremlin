import { useCallback, useRef, useState } from "react";
import { SandboxOutputSubscription } from "../graphql/queries/tasks";
import { clientLogger } from "../lib/logger";
import { useSubscription } from "./useSubscription";

export interface CommandStream {
  output: string;
  done: boolean;
  exitCode?: number | null;
}

export function useSandboxOutput(taskId: string) {
  const streamsRef = useRef(new Map<string, CommandStream>());
  const [, setVersion] = useState(0);

  useSubscription(
    SandboxOutputSubscription,
    { taskId },
    useCallback((data) => {
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
