import { useSubscription } from "@apollo/client";
import { useReducer, useRef } from "react";
import { SandboxOutputSubscription } from "../graphql/queries/tasks";
import { clientLogger } from "../lib/logger";

export interface CommandStream {
  output: string;
  done: boolean;
  exitCode?: number | null;
}

export function useSandboxOutput(taskId: string) {
  const streamsRef = useRef(new Map<string, CommandStream>());
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useSubscription(SandboxOutputSubscription, {
    variables: { taskId },
    onData: ({ data: { data } }) => {
      if (!data) return;
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
      forceRender();
    },
  });

  return streamsRef.current;
}
