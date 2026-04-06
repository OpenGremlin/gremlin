import { useApolloClient } from "@apollo/client";
import { useAudioPlayer } from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform } from "react-native";
import { SpeechStreamSubscription } from "../graphql/queries";
import { useAuth } from "./AuthContext";
import { useLocalSettings } from "./LocalSettingsContext";

interface VoiceContextValue {
  /** Start listening for speech events on the given scope. */
  subscribe: (scope: { agentId: string } | { taskId: string }) => void;
  /** Stop listening and clear the queue. */
  unsubscribe: () => void;
}

const VoiceContext = createContext<VoiceContextValue>({
  subscribe: () => {},
  unsubscribe: () => {},
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { voiceEnabled } = useLocalSettings();
  const { token } = useAuth();
  const client = useApolloClient();

  // Single player for the entire app — never duplicated
  const player = useAudioPlayer(null);

  // All mutable state lives in a single ref object to avoid stale closures
  // and to survive React StrictMode remount cycles.
  const state = useRef({
    buffer: new Map<number, string>(),
    nextToPlay: 0,
    isPlaying: false,
    currentLogId: null as string | null,
    maxSeenIndex: -1,
  });

  // Keep reactive values in refs so callbacks stay stable
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // Subscription handle so we can tear it down on scope change
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  // Track current scope so we can re-subscribe when voice is toggled on
  const scopeRef = useRef<{ agentId: string } | { taskId: string } | null>(
    null,
  );

  const resetState = useCallback(() => {
    state.current.buffer = new Map();
    state.current.nextToPlay = 0;
    state.current.isPlaying = false;
    state.current.currentLogId = null;
    state.current.maxSeenIndex = -1;
  }, []);

  const playNext = useCallback(() => {
    const s = state.current;
    const url = s.buffer.get(s.nextToPlay);
    if (url) {
      s.buffer.delete(s.nextToPlay);
      s.nextToPlay++;
      const wasPlaying = s.isPlaying;
      s.isPlaying = true;
      player.replace({
        uri: url,
        headers: tokenRef.current
          ? { Authorization: `Bearer ${tokenRef.current}` }
          : undefined,
      });
      // expo-audio's replace() internally calls play() when the player
      // was already active (wasPlaying). Only call play() explicitly
      // for the first sentence when the player is idle.
      if (!wasPlaying) {
        player.play();
      }
    } else {
      s.isPlaying = false;
    }
  }, [player]);

  // Native: advance on didJustFinish
  useEffect(() => {
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        playNext();
      }
    });
    return () => sub.remove();
  }, [player, playNext]);

  // Web fallback: poll for track end since expo-audio's web implementation
  // doesn't emit didJustFinish status updates.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      if (
        state.current.isPlaying &&
        player.duration > 0 &&
        player.currentTime >= player.duration - 0.15
      ) {
        playNext();
      }
    }, 250);
    return () => clearInterval(id);
  }, [player, playNext]);

  const handleChunk = useCallback(
    (chunk: {
      logId: string;
      sentenceIndex: number;
      url: string;
      done: boolean;
    }) => {
      const s = state.current;

      // New message — reset
      if (chunk.logId !== s.currentLogId) {
        s.currentLogId = chunk.logId;
        s.buffer = new Map();
        s.nextToPlay = 0;
        s.isPlaying = false;
        s.maxSeenIndex = -1;
        player.pause();
      }

      if (chunk.done) return;

      // Deduplicate re-delivered events
      if (chunk.sentenceIndex <= s.maxSeenIndex) return;
      s.maxSeenIndex = chunk.sentenceIndex;

      s.buffer.set(chunk.sentenceIndex, chunk.url);

      if (!s.isPlaying) {
        playNext();
      }
    },
    [player, playNext],
  );

  const startSubscription = useCallback(
    (scope: { agentId: string } | { taskId: string }) => {
      subRef.current?.unsubscribe();
      subRef.current = null;

      const variables =
        "taskId" in scope
          ? { taskId: scope.taskId }
          : { agentId: scope.agentId };

      const observable = client.subscribe({
        query: SpeechStreamSubscription,
        variables,
      });

      subRef.current = observable.subscribe({
        next: ({ data }) => {
          if (data?.speechStream) {
            handleChunk(data.speechStream);
          }
        },
      });
    },
    [client, handleChunk],
  );

  // subscribe/unsubscribe are stable — they read voiceEnabled from a ref
  // so useSpeechStream's effect deps don't churn on voice toggle.
  const subscribe = useCallback(
    (scope: { agentId: string } | { taskId: string }) => {
      scopeRef.current = scope;
      resetState();

      if (voiceEnabledRef.current) {
        startSubscription(scope);
      }
    },
    [resetState, startSubscription],
  );

  const unsubscribe = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    scopeRef.current = null;
    resetState();
    player.pause();
  }, [player, resetState]);

  // When voice is toggled, start or stop the subscription for the
  // current scope without re-running useSpeechStream's effect.
  useEffect(() => {
    if (voiceEnabled && scopeRef.current && !subRef.current) {
      startSubscription(scopeRef.current);
    } else if (!voiceEnabled) {
      subRef.current?.unsubscribe();
      subRef.current = null;
      resetState();
      player.pause();
    }
  }, [voiceEnabled, startSubscription, resetState, player]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ subscribe, unsubscribe }),
    [subscribe, unsubscribe],
  );

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
