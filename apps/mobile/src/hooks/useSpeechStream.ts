import { useEffect, useMemo } from "react";
import { useVoice } from "../lib/VoiceContext";

/**
 * Subscribe to sentence-level TTS audio for the given scope.
 * Delegates entirely to VoiceProvider which owns the singleton player.
 */
export function useSpeechStream(
  scope: { agentId: string } | { taskId: string },
) {
  const { subscribe, unsubscribe } = useVoice();
  const key = "taskId" in scope ? scope.taskId : scope.agentId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: stabilize scope identity by key
  const stableScope = useMemo(() => scope, [key]);

  useEffect(() => {
    subscribe(stableScope);
    return () => unsubscribe();
  }, [stableScope, subscribe, unsubscribe]);
}
