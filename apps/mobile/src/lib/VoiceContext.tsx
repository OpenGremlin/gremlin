import { useApolloClient } from "@apollo/client";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SpeechStreamSubscription } from "../graphql/queries";
import { AudioPlaybackEngine } from "./AudioPlaybackEngine";
import { useAuth } from "./AuthContext";
import { useLocalSettings } from "./LocalSettingsContext";

interface VoiceContextValue {
  subscribe: (scope: { agentId: string } | { taskId: string }) => void;
  unsubscribe: () => void;
  playUrls: (urls: string[]) => void;
  pause: () => void;
  resume: () => void;
  playing: boolean;
  paused: boolean;
  loading: boolean;
}

const VoiceContext = createContext<VoiceContextValue>({
  subscribe: () => {},
  playUrls: () => {},
  pause: () => {},
  resume: () => {},
  playing: false,
  paused: false,
  loading: false,
  unsubscribe: () => {},
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { voiceEnabled } = useLocalSettings();
  const { token } = useAuth();
  const client = useApolloClient();

  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
    });
  }, []);

  const playerA = useAudioPlayer(null);
  const playerB = useAudioPlayer(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const scopeRef = useRef<{ agentId: string } | { taskId: string } | null>(
    null,
  );

  // Create the engine once and keep it in a ref
  const engineRef = useRef<AudioPlaybackEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new AudioPlaybackEngine(
      playerA,
      playerB,
      (url) => ({
        uri: url,
        headers: tokenRef.current
          ? { Authorization: `Bearer ${tokenRef.current}` }
          : undefined,
      }),
      (status) => {
        setPlaying(status.playing);
        setPaused(status.paused);
        setLoading(status.loading);
      },
    );
  }
  const engine = engineRef.current;

  // Native: advance on didJustFinish, clear loading when audio starts
  useEffect(() => {
    const handle =
      (player: typeof playerA) =>
      (status: { didJustFinish?: boolean; playing?: boolean }) => {
        engine.onPlayerStatus(player, status);
      };
    const subA = playerA.addListener("playbackStatusUpdate", handle(playerA));
    const subB = playerB.addListener("playbackStatusUpdate", handle(playerB));
    return () => {
      subA.remove();
      subB.remove();
    };
  }, [playerA, playerB, engine]);

  // Web fallback: poll for track end
  useEffect(() => {
    if (process.env.EXPO_OS !== "web") return;
    const id = setInterval(() => {
      const active = engine.activePlayer;
      if (!engine.playing || !active) return;
      if (active.duration > 0 && active.currentTime >= active.duration - 0.15) {
        engine.advance();
      }
    }, 250);
    return () => clearInterval(id);
  }, [engine]);

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
            engine.handleChunk(data.speechStream);
          }
        },
      });
    },
    [client, engine],
  );

  const subscribe = useCallback(
    (scope: { agentId: string } | { taskId: string }) => {
      scopeRef.current = scope;
      engine.reset();

      if (voiceEnabledRef.current) {
        startSubscription(scope);
      }
    },
    [engine, startSubscription],
  );

  const unsubscribe = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    scopeRef.current = null;
    engine.fadeOutAndStop();
  }, [engine]);

  const playUrls = useCallback(
    (urls: string[]) => {
      engine.cancelFade();
      subRef.current?.unsubscribe();
      subRef.current = null;
      engine.playUrls(urls);
    },
    [engine],
  );

  // Toggle subscription when voice setting changes
  useEffect(() => {
    if (voiceEnabled && scopeRef.current && !subRef.current) {
      startSubscription(scopeRef.current);
    } else if (!voiceEnabled) {
      subRef.current?.unsubscribe();
      subRef.current = null;
      engine.reset();
      playerA.pause();
      playerB.pause();
    }
  }, [voiceEnabled, startSubscription, engine, playerA, playerB]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      engine.cleanup();
    };
  }, [engine]);

  const pause = useCallback(() => engine.pause(), [engine]);
  const resume = useCallback(() => engine.resume(), [engine]);

  const value = useMemo(
    () => ({
      subscribe,
      unsubscribe,
      playUrls,
      pause,
      resume,
      playing,
      paused,
      loading,
    }),
    [subscribe, unsubscribe, playUrls, pause, resume, playing, paused, loading],
  );

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
